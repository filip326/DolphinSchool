import checkAuth from "../composables/checkAuth";

export default eventHandler(async (event) => {
    
    const [ user, error ] = await checkAuth(event, {
        throwErrOnAuthFail: false
    });

    if (error) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized"
        });
    }

    return {
        username: user.username,
        fullName: user.fullName,
    };
});
