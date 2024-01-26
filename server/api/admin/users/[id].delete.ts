import { ObjectId } from "mongodb";
import { Permissions } from "~/server/Dolphin/PermissionsAndRoles/Manager";
import User from "~/server/Dolphin/User/User";

export default eventHandler(async (event) => {
    const checkAuthResult = await event.context.auth.checkAuth({
        PermissionLevel: Permissions.DELETE_USERS,
    });
    if (!checkAuthResult.success || !checkAuthResult.user) {
        throw createError({ statusCode: checkAuthResult.statusCode, message: "Failed" });
    }

    const { id } = getRouterParams(event);
    const userRes = await User.getUserById(new ObjectId(id));

    if (!userRes[0] || userRes[1]) {
        throw createError({ statusCode: 404, message: "User not found" });
    }

    userRes[0].setDeleted(true);

    return {
        statusCode: 200,
    };
});

