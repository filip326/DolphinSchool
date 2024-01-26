import { Permissions } from "~/server/Dolphin/PermissionsAndRoles/Manager";
import { SessionState } from "../../Dolphin/Session/Session";
import Session from "../../Dolphin/Session/Session";

export default defineEventHandler(async (event) => {
    // check authentication
    const checkAuthResult = await event.context.auth.checkAuth({});
    if (!checkAuthResult.user) {
        throw createError({ statusCode: 401, message: "Unauthorized 1" });
    }

    // get user object
    const user = checkAuthResult.user;

    // get session object
    const token = parseCookies(event).token;
    const [session, sessionFindError] = await Session.findSession(token);

    if (sessionFindError || !session) {
        throw createError({ statusCode: 401, message: "Unauthorized 2" });
    }

    // check if user needs 2fa and has not passed yet
    if (session.state !== SessionState.MFA_REQ) {
        throw createError({ statusCode: 401, message: "Unauthorized 3" });
    }

    // check if user has set up 2fa
    if (!user.mfaEnabled) {
        throw createError({ statusCode: 403, message: "MFA Not set up" });
    }

    if (!user.hasPermission(Permissions.GLOBAL_LOGIN)) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    // get totp code from body
    const { totp } = await readBody(event);

    // check if totp code matches pattern
    if (!/^[0-9]{6}$/.test(totp)) {
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

