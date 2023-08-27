export default defineEventHandler(async (event) => {
    if (
        !event.context.auth.authenticated ||
        event.context.auth.mfa_required ||
        !event.context.auth.user
    ) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    // cancel 2fa setup
    const [result, error] = await event.context.auth.user.cancelMFASetup();

    if (error && !result) {
        throw createError({
            statusCode: 500,
            message: "Internal Server Error",
        });
    }

    await event.context.auth.user.doNotAskForMFASetup("7d");

    if (result && !error) {
        return "Ok";
    }

    throw createError({
        statusCode: 500,
        message: "Internal Server Error",
    });
});
