import { ObjectId } from "mongodb";
import { DolphinErrorTypes } from "~/server/Dolphin/MethodResult";
import { Permissions } from "~/server/Dolphin/Permissions/PermissionManager";
import TutCourse from "~/server/Dolphin/Tut/TutCourse";

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

    const { year, teacherId, userIds, sek1 } = await readBody(event);

    if (!year || !teacherId || !sek1 || !sek1.className) {
        throw createError({
            statusCode: 400,
            message: "Missing parameters",
        });
    }

    if (typeof year !== "number" || typeof teacherId !== "object") {
        throw createError({
            statusCode: 400,
            message: "Year must be a number",
        });
    }

    if (userIds && typeof userIds !== "object") {
        throw createError({
            statusCode: 400,
            message: "Bad Request",
        });
    }

    let tutCourse: TutCourse | undefined;
    let tutCourseError: DolphinErrorTypes | null;

    if (year < 11) {
        const letters = sek1.className.match(/[a-zA-Z]+/g);
        const letter = letters.join("");

        [tutCourse, tutCourseError] = await TutCourse.create({
            grade: year,
            teacher: new ObjectId(teacherId[0]),
            letter: letter,
        });
    } else if (year >= 11) {
        [tutCourse, tutCourseError] = await TutCourse.create({
            grade: year,
            teacher: new ObjectId(teacherId[0]),
        });
    } else {
        throw createError({
            statusCode: 400,
            message: "Bad Request",
        });
    }

    if (!tutCourse || tutCourseError) {
        throw createError({
            statusCode: 500,
            message: "Failed to create tut course",
        });
    }

    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
        for (const userId of userIds) {
            const addStudentResult = await tutCourse?.addStudent(new ObjectId(userId));
            if (!addStudentResult || !addStudentResult[0] || addStudentResult[1]) {
                throw createError({
                    statusCode: 500,
                    message: "Failed to add student to tut course",
                });
            }
        }
    }

    return {
        statusCode: 200,
    };
});
