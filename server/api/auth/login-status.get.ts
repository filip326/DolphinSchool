export default defineEventHandler(async (event) => {
    // check authentication
    const checkAuthResult = await event.context.auth.checkAuth();

    // check if authentication failed and mfa is not required
    if (!checkAuthResult.success && !event.context.auth.mfa_required) {
        return {
            statusCode: 401,
            statusMessage: "Unauthorized",
        };
    }

    if (!checkAuthResult.user) {
        return {
            statusCode: 401,
            statusMessage: "Unauthorized",
        };
    }

    // check if user needs 2fa
    if (event.context.auth.mfa_required && checkAuthResult.user.mfaEnabled) {
        return {
            statusCode: 403,
            statusMessage: "2FA required",
        };
    }

    return {
        statusCode: 200,
        statusMessage: "OK",
    };
});
