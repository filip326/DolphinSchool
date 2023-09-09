import { Permissions } from "~/server/Dolphin/Permissions/PermissionManager";
import Dolphin from "~/server/Dolphin/Dolphin";

export default eventHandler(async (event) => {
    const checkAuthResult = await event.context.auth.checkAuth({
        minimumPermissionLevel: Permissions.MANAGE_BLOCKED_PWDS,
    });
    if (!checkAuthResult.success || !checkAuthResult.user) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    return await Dolphin.getBlockedPwds();
});
