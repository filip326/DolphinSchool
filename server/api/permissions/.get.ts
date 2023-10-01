export default eventHandler(async (event) => {
    const { success, statusCode, user } = await event.context.auth.checkAuth();

    if (!success || !user) {
        throw createError({
            statusCode,
        });
    }

    const permissions = await readBody(event);

    if (
        !permissions ||
        typeof permissions !== "object" ||
        !Array.isArray(permissions) ||
        permissions.some((permission) => typeof permission !== "number")
    ) {
        throw createError({
            statusCode: 400,
        });
    }

    const result: { [permission: number]: boolean } = {};
    for (const permission of permissions) {
        result[permission] = user.hasPermission(permission);
    }
    return result;
});
