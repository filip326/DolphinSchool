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

    // check if user is setting up 2fa
    if (!user.isSettingUp2fa) {
        throw createError({ statusCode: 400, message: "2fa is not in set-up mode" });
    }

    // check if user has set up 2fa
    if (user.mfaEnabled) {
        throw createError({ statusCode: 400, message: "2fa already set up" });
    }

    // get password (1st factor) and totp (2nd factor) from body
    const { totp } = await readBody(event);

    // check if totp code matches pattern
    if (!/^[0-9]{6}$/.test(totp)) {
        throw createError({ statusCode: 400, message: "TOTP Token invalid" });
    }

    // check if totp code is valid
    const [completeMFASetup, completeMFASetupError] = await user.completeMFASetup(totp);

    if (completeMFASetupError) {
        throw createError({ statusCode: 500, message: "Internal Server Error" });
    }

    if (!completeMFASetup) {
        throw createError({ statusCode: 401, message: "TOTP Token invalid." });
    }

    // confirm 2fa setup
    return "Ok";
});
