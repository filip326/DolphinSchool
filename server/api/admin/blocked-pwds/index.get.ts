import { Permissions } from "~/server/Dolphin/Permissions/PermissionManager";
import Dolphin from "~/server/Dolphin/Dolphin";

export default eventHandler(async (event) => {
    const checkAuthResult = await event.context.auth.checkAuth({
        PermissionLevel: Permissions.MANAGE_BLOCKED_PWDS,
    });
    if (!checkAuthResult.success || !checkAuthResult.user) {
        throw createError({ statusCode: checkAuthResult.statusCode, message: "Failed" });
    }

    return await Dolphin.getBlockedPwds();
});
