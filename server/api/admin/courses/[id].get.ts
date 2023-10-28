import { ObjectId } from "mongodb";
import Course from "~/server/Dolphin/Course/Course";
import Subject from "~/server/Dolphin/Course/Subject";
import { Permissions } from "~/server/Dolphin/Permissions/PermissionManager";
import User from "~/server/Dolphin/User/User";

export default defineEventHandler(async (event) => {
    const { success, statusCode } = await event.context.auth.checkAuth({
        PermissionLevel: Permissions.MANAGE_COURSES,
    });
    if (!success) {
        throw createError({
            statusCode: statusCode,
        });
    }

    const { id } = getRouterParams(event);
    if (!id || typeof id !== "string") {
        throw createError({
            statusCode: 400,
            message: "Invalid query parameters",
        });
    }

    if (!ObjectId.isValid(id)) {
        throw createError({
            statusCode: 400,
            message: "Invalid query parameters",
        });
    }

    const [course, courseFindError] = await Course.getById(
        ObjectId.createFromHexString(id),
    );
    if (courseFindError) {
        throw createError({
            statusCode: 404,
            message: "Course not found",
        });
    }

    // get members
    const members = (
        await Promise.all(
            course.students.map(async (memberId) => {
                return (await User.getUserById(memberId))[0];
            }),
        )
    )
        .filter((user) => user !== null)
        .map((user) => user!.fullName);

    // get teacher name
    const teachers = (
        (
            await Promise.all(
                course.teacher.map(async (teacherId) => {
                    return (await User.getUserById(new ObjectId(teacherId)))[0];
                }),
            )
        ).filter((user) => user !== undefined) as User[]
    )
        .map((user) => user.fullName)
        .join(", ");

    // get subject name
    const [subject, subjectFindError] = await Subject.getSubjectById(
        new ObjectId(course.subject),
    );
    if (subjectFindError) {
        throw createError({
            statusCode: 404,
            message: "Subject not found",
        });
    }

    return {
        _id: course._id.toHexString(),
        name: course.name,
        subject: subject.longName,
        teacher: teachers,
        members,
    };
});
