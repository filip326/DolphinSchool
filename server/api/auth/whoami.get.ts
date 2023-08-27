export default eventHandler(async (event) => {
    if (
        !event.context.auth.authenticated ||
        event.context.auth.mfa_required ||
        !event.context.auth.user
    ) {
        throw createError({ statusCode: 401, message: "Unauthorized", });
    }

    return {
        username: event.context.auth.user.username,
        fullName: event.context.auth.user.fullName,
    };
});
