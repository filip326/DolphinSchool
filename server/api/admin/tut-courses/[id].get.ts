import { ObjectId } from "mongodb";
import { Permissions } from "~/server/Dolphin/Permissions/PermissionManager";
import TutCourse from "~/server/Dolphin/Tut/TutCourse";

export default defineEventHandler(async (event) => {
    const { success, statusCode } = await event.context.auth.checkAuth({
        PermissionLevel: Permissions.MANAGE_COURSES,
    });
    if (!success) {
        throw createError({
            statusCode: statusCode,
        });
    }

    const { id } = await getRouterParams(event);

    const [tutCourse, tutCourseErr] = await TutCourse.getTutCourseById(new ObjectId(id));

    if (tutCourseErr) {
        throw createError({
            message: "Error getting tut course",
            statusCode: 404,
        });
    }

    return {
        id: tutCourse._id,
        name: tutCourse.name,
        grade: tutCourse.grade,
        students: tutCourse.students,
        teacher: tutCourse.teacher,
        viceTeacher: tutCourse.viceTeacher,
    };
});
