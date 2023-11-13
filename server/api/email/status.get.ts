
export default defineEventHandler(async (event) => {

    const { success, statusCode, user } = await event.context.auth.checkAuth();
    if (!success) {
        throw createError({
            statusMessage: "Unauthorized",
            statusCode: statusCode,
        });
    }
    if (!user) {
        throw createError({
            statusMessage: "Unauthorized",
            statusCode: 401,
        });
    }

    const [ email, err ] = await EMailNo

});