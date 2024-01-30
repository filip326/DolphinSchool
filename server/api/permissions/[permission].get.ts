import { Permissions } from "~/server/Dolphin/PermissionsAndRoles/PermissionManager";

export default eventHandler(async (event) => {
    const { success, statusCode, user } = await event.context.auth.checkAuth();

    if (!success || !user) {
        throw createError({
            statusCode,
        });
    }

    const permission = getRouterParam(event, "permission");

    if (!permission || !(permission in Permissions)) {
        throw createError({
            statusCode: 404,
        });
    }

    const hasPermission = await user.hasPermission(
        Permissions[permission as keyof typeof Permissions],
    );

    return hasPermission;
});

