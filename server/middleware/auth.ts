import { H3Event } from "h3";
import Session, { SessionState } from "../Dolphin/Session/Session";
import User from "@/server/Dolphin/User/User";
import { CheckAuthOptions, CheckAuthResult } from "../types/auth";

export default defineEventHandler(async (event) => {
    event.context.auth = {
        authenticated: false,
        user: undefined,
        mfa_required: false,
        checkAuth: async (event: H3Event, options: CheckAuthOptions): Promise<CheckAuthResult> => {
            if (!event.context.auth.authenticated) {
                if (event.context.auth.mfa_required) {
                    return {
                        success: false,
                        statusCode: 401,
                        user: event.context.auth.user,
                    };
                }

                return {
                    success: false,
                    statusCode: 401,
                };
            }

            if (!event.context.auth.user) {
                return {
                    success: false,
                    statusCode: 401,
                };
            }

            if (options.minimumPermissionLevel) {
                if (event.context.auth.user.hasPermission(options.minimumPermissionLevel)) {
                    return {
                        success: false,
                        statusCode: 403,
                    };
                }
            }

            return {
                success: true,
                statusCode: 200,
                user: event.context.auth.user,
            };
        },
    };
    // get token from cookies
    const token = parseCookies(event).token;

    // no token, event.context.auth = false; do nothing
    if (!token) {
        event.context.auth.authenticated = false;
        event.context.auth.mfa_required = false;
        event.context.auth.user = undefined;
        return;
    }

    // check if token is valid
    const [session, sessionFindError] = await Session.findSession(token);

    if (sessionFindError || !session) {
        event.context.auth.authenticated = false;
        event.context.auth.mfa_required = false;
        event.context.auth.user = undefined;
        return;
    }

    await session.reportUsage();

    // check if session is expired
    if (session.isExpired) {
        event.context.auth.authenticated = false;
        event.context.auth.mfa_required = false;
        event.context.auth.user = undefined;
        return;
    }

    // get user from session
    const [user, userFindError] = await User.getUserById(session.userId);
    if (userFindError) {
        event.context.auth.authenticated = false;
        event.context.auth.mfa_required = false;
        event.context.auth.user = undefined;
        return;
    }

    // check if user needs 2fa and has not passed yet
    if (session.state === SessionState.MFA_REQ) {
        event.context.auth.authenticated = false;
        event.context.auth.mfa_required = true;
        event.context.auth.user = user;
        return;
    }

    // check if session is active
    if (session.state === SessionState.ACTIVE) {
        event.context.auth.authenticated = true;
        event.context.auth.mfa_required = false;
        event.context.auth.user = user;
        // set cookie again to apply new expiration date in case of extension
        setCookie(event, "token", session.token, {
            maxAge: session.expires - Date.now(),
            path: "/",
            sameSite: "strict",
            secure: useRuntimeConfig().prod,
            httpOnly: true,
        });
        return;
    }

    event.context.auth.authenticated = false;
    event.context.auth.mfa_required = false;
    event.context.auth.user = undefined;

    return;
});
