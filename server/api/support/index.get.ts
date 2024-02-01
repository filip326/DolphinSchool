import { Permissions } from "~/server/Dolphin/PermissionsAndRoles/PermissionManager";

export default defineEventHandler(async (event) => {
    const { success, user, statusCode } = await event.context.auth.checkAuth({
        PermissionLevel: Permissions.CHANGE_USER_PASSWORD,
    });
    if (!success || !user) {
        throw createError({ statusCode });
    }

    // todo
});
