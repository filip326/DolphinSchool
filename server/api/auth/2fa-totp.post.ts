import { SessionState } from "../../Dolphin/Session/Session";
import Session from "../../Dolphin/Session/Session";

export default defineEventHandler(async (event) => {
    // check authentication without 2fa
    if (
        !event.context.auth.authenticated ||
        event.context.auth.mfa_required ||
        !event.context.auth.user
    ) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    // get user object
    const user = event.context.auth.user;

    // get session object
    const token = parseCookies(event).token;
    const [session, sessionFindError] = await Session.findSession(token);

    if (sessionFindError || !session) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    // check if user needs 2fa and has not passed yet
    if (session.state !== SessionState.MFA_REQ) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    // check if user has set up 2fa
    if (!user.mfaEnabled) {
        return "2fa not set up";
    }

    // get totp code from body
    const { totp } = await readBody(event);

    // check if totp code matches pattern
    if (!/^[0-9]{8}$/.test(totp)) {
        throw createError({ statusCode: 400, message: "TOTP Token invalid" });
    }

    // check if totp code is valid

    if (!user.checkMFA(totp)) {
        throw createError({ statusCode: 401, message: "TOTP Token invalid" });
    }

    // activate session
    session.activate();

    return {
        statusCode: 200,
        statusMessage: "OK",
    };
});
