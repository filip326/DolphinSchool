export default defineEventHandler(async (event) => {
    // check authentication
    const checkAuthResult = await event.context.auth.checkAuth({});
    if (!checkAuthResult.success || !checkAuthResult.user) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }
    // get user object
    const user = checkAuthResult.user;

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
