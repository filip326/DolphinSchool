import Dolphin from "~/server/Dolphin/Dolphin";
import { Permissions } from "~/server/Dolphin/PermissionsAndRoles/PermissionManager";

export default eventHandler(async (event) => {
    const checkAuthResult = await event.context.auth.checkAuth({
        PermissionLevel: Permissions.MANAGE_BLOCKED_PWDS,
    });
    if (!checkAuthResult.success || !checkAuthResult.user) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    const { pwd } = await readBody(event);

    if (!pwd) throw createError({ statusCode: 400, message: "Bad Request" });

    return await Dolphin.addBlockedPwd(pwd);
});
