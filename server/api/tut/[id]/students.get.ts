import { ObjectId } from "mongodb";
import { Permissions } from "~/server/Dolphin/PermissionsAndRoles/PermissionManager";
import TutCourse from "~/server/Dolphin/Tut/TutCourse";
import User from "~/server/Dolphin/User/User";

type StudentsReturn = {
    id: string;
    name: string;
}[];

export default defineEventHandler(async (event): Promise<StudentsReturn> => {
    const { success, user, statusCode } = await event.context.auth.checkAuth();
    if (!success || !user) {
        throw createError({ statusCode });
    }

    const tutCourseId = getRouterParam(event, "id");

    if (
        !tutCourseId ||
        typeof tutCourseId !== "string" ||
        !ObjectId.isValid(tutCourseId)
    ) {
        throw createError({
            statusCode: 400,
            message: "Invalid id",
        });
    }

    const [tutCourse, tutCourseError] = await TutCourse.getTutCourseById(
        new ObjectId(tutCourseId),
    );

    if (tutCourseError) {
        throw createError({
            statusCode: 500,
            message: "Failed",
        });
    }

    let permissionToView = false;

    // check if user has manage courses permission
    if (user.hasPermission(Permissions.MANAGE_COURSES)) {
        permissionToView = true;
    }

    // check if user is the teacher of the course
    if (!permissionToView && tutCourse.teacher.equals(user._id)) {
        permissionToView = true;
    }
    if (
        !permissionToView &&
        tutCourse.viceTeacher &&
        tutCourse.viceTeacher.equals(user._id)
    ) {
        permissionToView = true;
    }

    // check if user is a student in the course
    if (!permissionToView) {
        if (tutCourse.students.some((v) => v.equals(user._id))) {
            permissionToView = true;
        }
    }

    // check if user is a parent of a student in the course
    if (!permissionToView) {
        for await (const student of tutCourse.students) {
            const [studentUser, studentUserError] = await User.getUserById(student);
            if (studentUserError) {
                throw createError({
                    statusCode: 500,
                    message: "Failed",
                });
            }

            if (!studentUser) {
                throw createError({
                    statusCode: 500,
                    message: "Failed",
                });
            }

            if (
                studentUser.parents &&
                studentUser.parents.some((v) => v.equals(user._id))
            ) {
                permissionToView = true;
                break;
            }
        }
    }

    if (!permissionToView) {
        throw createError({
            statusCode: 403,
            message: "You do not have permission to view this course",
        });
    }

    if (!tutCourse) {
        throw createError({
            statusCode: 404,
            message: "Course not found",
        });
    }

    const students: StudentsReturn = await Promise.all(
        tutCourse.students.map(async (student) => {
            const [user, userError] = await User.getUserById(student);
            if (userError) {
                throw createError({
                    statusCode: 500,
                    message: "Failed",
                });
            }
            if (!user) {
                throw createError({
                    statusCode: 404,
                    message: "User not found",
                });
            }
            return {
                id: user._id.toHexString(),
                name: user.fullName,
            };
        }),
    );

    return students;
});
