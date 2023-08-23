import checkAuth from "@/server/composables/checkAuth";

export default defineEventHandler(async (event) => {

    // get auth
    const [user, authError] = await checkAuth(event);

    if (authError || !user) {
        throw createError({
            statusCode: 401,
            message: "Unauthorized"
        });
    }

    // cancel 2fa setup
    const [result, error] = await user.cancelMFASetup();

    if (error && !result) {
        throw createError({
            statusCode: 500,
            message: "Internal Server Error"
        });
    }

    await user.doNotAskForMFASetup("7d");

    if (result && !error) {
        return "Ok";
    }

    throw createError({
        statusCode: 500,
        message: "Internal Server Error"
    });

});