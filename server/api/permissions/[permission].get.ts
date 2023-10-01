export default eventHandler(async (event) => {
    const { success, statusCode, user } = await event.context.auth.checkAuth();

    if (!success || !user) {
        throw createError({
            statusCode,
        });
    }

    const permission = getRouterParam(event, "permission");

    if (!permission || isNaN(parseInt(permission))) {
        throw createError({ statusCode: 404, statusMessage: "Permission not found" });
    }

    const requestedPermission = parseInt(permission);

    return user.hasPermission(requestedPermission);
});
