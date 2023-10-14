import { ObjectId } from "mongodb";
import { Permissions } from "~/server/Dolphin/Permissions/PermissionManager";
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

    return {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        type: user.type,
        mfaEnabled: user.mfaEnabled,
        parents: user.parents, // Schüler only
        kuezel: user.kuerzel, // Lehrkraft only
    };
});
