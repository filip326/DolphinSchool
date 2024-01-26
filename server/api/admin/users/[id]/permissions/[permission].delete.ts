import { ObjectId } from "mongodb";
import {
    Permissions,
    isAdminLevelPermission,
} from "~/server/Dolphin/PermissionsAndRoles/Manager";
import User from "~/server/Dolphin/User/User";

export default defineEventHandler(async (event) => {
    // check for permission (MANAGE_USERS_PERMISSIONS)
    const { success, statusCode, user } = await event.context.auth.checkAuth();
    if (!success) {
        throw createError({ statusCode });
    }

    if (
        !user.hasPermission(Permissions.MANAGE_USERS_PERMISSIONS) &&
        !user.hasPermission(Permissions.MANAGE_ADMIN_LEVEL_PERMISSIONS)
    ) {
        throw createError({ statusCode: 403 });
    }

    // check url path params
    // id needs to be a valid ObjectId
    // permission needs to be a valid permission string
    const { id, permission } = getRouterParams(event);

    if (!id || !permission) {
        throw createError({ statusCode: 400, statusMessage: "Missing params" });
    }

    if (typeof id !== "string" || !ObjectId.isValid(id)) {
        throw createError({ statusCode: 400, statusMessage: "Invalid user id" });
    }

    const [target, targetFindError] = await User.getUserById(
        ObjectId.createFromHexString(id),
    );
    if (targetFindError || !target) {
        throw createError({ statusCode: 404 });
    }

    if (typeof permission !== "string" || !isNaN(parseInt(permission))) {
        throw createError({ statusCode: 400, statusMessage: "Invalid permission type" });
    }

    if (!(permission in Permissions)) {
        throw createError({ statusCode: 400 });
    }

    // check if it is an admin level permission
    if (
        isAdminLevelPermission(Permissions[permission as keyof typeof Permissions]) &&
        !user.hasPermission(Permissions.MANAGE_ADMIN_LEVEL_PERMISSIONS)
    ) {
        throw createError({ statusCode: 403 });
    }

    // check if the target has the permission
    if (!target.hasPermission(Permissions[permission as keyof typeof Permissions])) {
        throw createError({ statusCode: 400 });
    }

    // remove the permission
    const [result, error] = await target.denyPermission(
        Permissions[permission as keyof typeof Permissions],
    );
    if (error) {
        throw createError({ statusCode: 500 });
    }

    // return the result
    return {
        success: result,
    };
});

