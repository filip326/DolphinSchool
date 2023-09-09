// import Course from "~/server/Dolphin/Course/Course";
import { Permissions } from "~/server/Dolphin/Permissions/PermissionManager";

export default eventHandler(async (event) => {
    const checkAuthResult = await event.context.auth.checkAuth(event, {
        minimumPermissionLevel: Permissions.CREATE_COURSE,
    });
    if (!checkAuthResult.success || !checkAuthResult.user) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }
});
