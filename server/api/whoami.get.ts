import checkAuth from "../composables/checkAuth";

export default eventHandler(async (event) => {
    
    const {success, usr} = await checkAuth(event, {
        authRequired: true,
        throwErrOnAuthFail: true
    });

    if (!success) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized"
        });
    }

    return {
        statusCode: 200,
        username: usr!.username,
        fullName: usr!.fullName,
        type: usr!.type
    };
});
