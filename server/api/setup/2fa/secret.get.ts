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
    if (user.mfaEnabled) {
        throw createError({ statusCode: 400, message: "2fa already set up" });
    }

    // setup 2fa
    const [secret, secretError] = await user.setUpMFA();

    if (secretError) {
        throw createError({ statusCode: 500, message: "Internal Server Error" });
    }

    // send response with secret to client
    return { secret: secret };
});
