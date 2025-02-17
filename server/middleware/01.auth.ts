import Session, { SessionState } from "../Dolphin/Session/Session";
import User from "@/server/Dolphin/User/User";
import { CheckAuthOptions, CheckAuthResult } from "../types/auth";
import { Permissions } from "../Dolphin/PermissionsAndRoles/PermissionManager";

export default defineEventHandler(async (event) => {
    event.context.auth = {
        authenticated: false,
        user: undefined,
        change_password_required: false,
        mfa_required: false,
        checkAuth: async (options: CheckAuthOptions = {}): Promise<CheckAuthResult> => {
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

            if (options.PermissionLevel) {
                if (!event.context.auth.user.hasPermission(options.PermissionLevel)) {
                    return {
                        success: false,
                        statusCode: 403,
                        user: event.context.auth.user,
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

    if (user.changePasswordRequired) {
        event.context.auth.change_password_required = true;
    }

    if (!user.hasPermission(Permissions.GLOBAL_LOGIN)) {
        event.context.auth.authenticated = false;
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
