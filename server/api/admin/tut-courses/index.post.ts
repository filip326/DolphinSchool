import { Permissions } from "~/server/Dolphin/Permissions/PermissionManager";

export default defineEventHandler(async (event) => {
    // check if user has permission to create a course
    const { success, statusCode } = await event.context.auth.checkAuth({
        PermissionLevel: Permissions.MANAGE_COURSES,
    });
    if (!success) {
        throw createError({
            statusCode: statusCode,
        });
    }
});
