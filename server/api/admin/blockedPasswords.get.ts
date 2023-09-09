import { Permissions } from "~/server/Dolphin/Permissions/PermissionManager";
import User from "~/server/Dolphin/User/User";

export default eventHandler(async (event) => {
    const checkAuthResult = await event.context.auth.checkAuth(event, {
        minimumPermissionLevel: Permissions.MANAGE_BLOCKED_PWDS,
    });
    if (!checkAuthResult.success || !checkAuthResult.user) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    return await User.getBlockedPwds();
});
