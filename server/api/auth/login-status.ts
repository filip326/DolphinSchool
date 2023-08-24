export default defineEventHandler(async (event) => {
    // check authentication
    if (!event.context.auth.authenticated || !event.context.auth.user) {
        return {
            statusCode: 401,
            statusMessage: "Not authenticated",
        };
    }

    // check if user needs 2fa
    if (event.context.auth.mfa_required && event.context.auth.user.mfaEnabled) {
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
