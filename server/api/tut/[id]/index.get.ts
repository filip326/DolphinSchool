import { ObjectId } from "mongodb";
import { Permissions } from "~/server/Dolphin/PermissionsAndRoles/Manager";
import TutCourse from "~/server/Dolphin/Tut/TutCourse";
import User from "~/server/Dolphin/User/User";

type TutCourseResponse = {
    id: string;
    name: string;

    teacher: {
        id: string;
        name: string;
    };
    viceTeacher?: {
        id: string;
        name: string;
    };
};

export default defineEventHandler(async (event): Promise<TutCourseResponse> => {
    const { success, user, statusCode } = await event.context.auth.checkAuth();

    if (!success || !user) {
        throw createError({
            statusCode: statusCode,
        });
    }

    // check if the id (path parameter) is a valid id
    const id = getRouterParam(event, "id");

    if (!id || typeof id !== "string" || !ObjectId.isValid(id)) {
        throw createError({
            statusCode: 400,
            message: "Invalid id",
        });
    }

    let permissionToView = false;

    // check if user has manage courses permission
    if (user.hasPermission(Permissions.MANAGE_COURSES)) {
        permissionToView = true;
    }
    // return the course data
    const [course, courseError] = await TutCourse.getTutCourseById(new ObjectId(id));
    if (courseError) {
        throw createError({
            statusCode: 500,
            message: "Failed",
        });
    }

    if (!course) {
        throw createError({
            statusCode: 404,
            message: "Course not found",
        });
    }

    // check if user is the teacher of the course
    if (!permissionToView && course.teacher.equals(user._id)) {
        permissionToView = true;
    }
    if (!permissionToView && course.viceTeacher && course.viceTeacher.equals(user._id)) {
        permissionToView = true;
    }

    // check if user is a student in the course
    if (!permissionToView) {
        if (course.students.some((v) => v.equals(user._id))) {
            permissionToView = true;
        }
    }

    // check if user is a parent of a student in the course
    if (!permissionToView) {
        for await (const student of course.students) {
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

    const [teacher, teacherError] = await User.getUserById(course.teacher);
    if (teacherError) {
        throw createError({
            statusCode: 500,
            message: "Failed",
        });
    }

    if (!teacher) {
        throw createError({
            statusCode: 500,
            message: "Failed",
        });
    }

    if (course.viceTeacher) {
        const [viceTeacher, viceTeacherError] = await User.getUserById(
            course.viceTeacher,
        );
        if (viceTeacherError) {
            throw createError({
                statusCode: 500,
                message: "Failed",
            });
        }

        if (!viceTeacher) {
            throw createError({
                statusCode: 500,
                message: "Failed",
            });
        }

        return {
            id: course._id.toHexString(),
            name: course.name,
            teacher: {
                id: teacher._id.toHexString(),
                name: teacher.fullName,
            },
            viceTeacher: {
                id: viceTeacher._id.toHexString(),
                name: viceTeacher.fullName,
            },
        };
    }

    return {
        id: course._id.toHexString(),
        name: course.name,
        teacher: {
            id: teacher._id.toHexString(),
            name: teacher.fullName,
        },
    };
});
