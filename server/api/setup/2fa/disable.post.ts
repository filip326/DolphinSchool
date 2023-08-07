export default defineEventHandler(async (event) => {

    // check authentication
    if (
        !event.context.auth.authenticated ||
        event.context.auth.mfa_required ||
        !event.context.auth.user
    ) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    // get objects
    const user = event.context.auth.user;

    // check if user has set up 2fa
    if (!user.mfaEnabled) {
        throw createError({ statusCode: 400, message: "2fa is not set up yet" });
    }

    // get password (1st factor) and totp (2nd factor) from body
    const { password, totp } = await readBody(event);

    // check if password
    if (!password) {
        throw createError({ statusCode: 400, message: "Password required" });
    }

    // check if totp code matches pattern
    if (!/^[0-9]{6}$/.test(totp)) {
        throw createError({ statusCode: 400, message: "TOTP Token invalid" });
    }

    // check if password is valid
    if (!user.comparePassword(password)) {
        throw createError({ statusCode: 401, message: "Password invalid" });
    }

    // check if totp code is valid
    if (!user.checkMFA(totp)) {
        throw createError({ statusCode: 401, message: "TOTP Token invalid." });
    }

    // disable 2fa
    const [ disableMFA, disableMFAError ] = await user.disableMFA();

    if (disableMFAError) {
        throw createError({ statusCode: 500, message: "Internal Server Error" });
    }

    if (!disableMFA) {
        throw createError({ statusCode: 401, message: "Could not disable MFA" });
    }

    // confirm 2fa disable
    return "Ok";
});