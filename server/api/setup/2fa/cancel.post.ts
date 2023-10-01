export default defineEventHandler(async (event) => {
    // check authentication
    const checkAuthResult = await event.context.auth.checkAuth({});
    if (!checkAuthResult.success || !checkAuthResult.user) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }
    // get user object
    const user = checkAuthResult.user;

    // cancel 2fa setup
    const [result, error] = await user.cancelMFASetup();

    if (error && !result) {
        throw createError({
            statusCode: 500,
            message: "Internal Server Error",
        });
    }

    await user.doNotAskForMFASetup("7d");

    if (result && !error) {
        return "Ok";
    }

    throw createError({
        statusCode: 500,
        message: "Internal Server Error",
    });
});
