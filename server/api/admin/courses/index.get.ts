import Course from "~/server/Dolphin/Course/Course";
import { Permissions } from "~/server/Dolphin/PermissionsAndRoles/PermissionManager";

export default defineEventHandler(async (event) => {
    const { success, statusCode } = await event.context.auth.checkAuth({
        PermissionLevel: Permissions.MANAGE_COURSES,
    });
    if (!success) {
        throw createError({
            statusCode: statusCode,
        });
    }

    // get search (name query), limit and skip from query
    const { limit, skip, search } = getQuery(event);

    if (limit && typeof limit !== "number") {
        throw createError({
            statusCode: 400,
            message: "Invalid query parameters",
        });
    }

    if (skip && typeof skip !== "number") {
        throw createError({
            statusCode: 400,
            message: "Invalid query parameters",
        });
    }

    if (search && typeof search !== "string") {
        throw createError({
            statusCode: 400,
            message: "Invalid query parameters",
        });
    }

    // get courses from db
    // default value for search is undefined
    // default value for limit is 25
    // default value for skip is 0
    const [courses, coursesFindError] = await Course.list({
        search: search as string | undefined,
        limit: limit as number | undefined,
        skip: skip as number | undefined,
    });

    if (coursesFindError) {
        throw createError({
            statusCode: 500,
            message: "Error while finding courses",
        });
    }

    // return courses as
    // { name: string;
    // id: string;
    // teacher: string;
    // student_count: number; }[]

    return courses.map((course) => ({
        name: course.name,
        id: course._id.toHexString(),
        teacher: course.teacher,
        student_count: course.students.length,
    }));
});
