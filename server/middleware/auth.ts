import Session, { SessionState } from "../Dolphin/Session/Session";
import User from "@/server/Dolphin/User/User";

export default defineEventHandler(async (event) => {
    event.context.auth = {
        authenticated: false,
        mfa_required: false,
        user: undefined,
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
