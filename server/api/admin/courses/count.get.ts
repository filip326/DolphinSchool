import Course from "~/server/Dolphin/Course/Course";
import { Permissions } from "~/server/Dolphin/Permissions/PermissionManager";

export default defineEventHandler(async event => {
    const { success, statusCode } = await event.context.auth.checkAuth({ PermissionLevel: Permissions.MANAGE_COURSES });
    if (!success) {
        throw createError({
            statusCode: statusCode,
        });
    }

    const { search } = getQuery(event);
    if (search && typeof search !== "string") {
        throw createError({
            statusCode: 400,
            message: "Invalid query parameters",
        });
    }

    const courseCount = await Course.count(search as string | undefined);

    return courseCount;

});