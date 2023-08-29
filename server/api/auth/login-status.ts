export default defineEventHandler(async (event) => {
    // check authentication
    const checkAuthResult = await event.context.auth.checkAuth(event, {});
    if (!checkAuthResult.success || !checkAuthResult.user) {
        return {
            statusCode: 401,
            statusMessage: "Not authenticated",
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
