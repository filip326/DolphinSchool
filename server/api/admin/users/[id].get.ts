import { ObjectId } from "mongodb";
import {
    Permissions,
    isAdminLevelPermission,
} from "~/server/Dolphin/PermissionsAndRoles/PermissionManager";
import User from "~/server/Dolphin/User/User";

export default eventHandler(async (event) => {
    const checkAuthResult = await event.context.auth.checkAuth({
        PermissionLevel: Permissions.VIEW_ALL_USERS,
    });
    if (!checkAuthResult.success || !checkAuthResult.user) {
        throw createError({ statusCode: checkAuthResult.statusCode, message: "Failed" });
    }

    const { id } = getRouterParams(event);
    const userRes = await User.getUserById(new ObjectId(id));

    if (!userRes[0] || userRes[1]) {
        throw createError({ statusCode: 404, message: "User not found" });
    }

    const user = userRes[0];

    const returnObject: {
        id: string;
        username: string;
        fullName: string;
        type: string;
        mfaEnabled: boolean;
        parents?: ObjectId[];
        kuezel?: string;
        permissions?: {
            [key: string]: boolean;
        };
    } = {
        id: user._id.toHexString(),
        username: user.username,
        fullName: user.fullName,
        type: user.type,
        mfaEnabled: user.mfaEnabled,
        parents: user.parents, // Schüler only
        kuezel: user.kuerzel, // Lehrkraft only
        permissions: undefined,
    };

    if (
        checkAuthResult.user.hasPermission(Permissions.MANAGE_USERS_PERMISSIONS) ||
        checkAuthResult.user.hasPermission(Permissions.MANAGE_ADMIN_LEVEL_PERMISSIONS)
    ) {
        const manageAdmin = checkAuthResult.user.hasPermission(
            Permissions.MANAGE_ADMIN_LEVEL_PERMISSIONS,
        );
        returnObject.permissions = {};
        for (const permission of Object.keys(Permissions)) {
            if (typeof permission === "string" && isNaN(parseInt(permission))) {
                if (
                    manageAdmin ||
                    !isAdminLevelPermission(
                        Permissions[permission as keyof typeof Permissions],
                    )
                ) {
                    returnObject.permissions[permission] = user.hasPermission(
                        Permissions[permission as keyof typeof Permissions],
                    );
                }
            }
        }
    }

    return returnObject;
});
