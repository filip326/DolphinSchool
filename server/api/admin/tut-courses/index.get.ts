import { ObjectId } from "mongodb";
import { Permissions } from "~/server/Dolphin/Permissions/PermissionManager";
import TutCourse from "~/server/Dolphin/Tut/TutCourse";
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

    if (search && typeof search === "string") {
        const [courses, coursesFindError] = await TutCourse.searchTutCourseByName(
            search,
            (skip ?? 0) as number,
            (limit ?? 10) as number,
        );
        if (coursesFindError) {
            throw createError({
                statusCode: 500,
                message: "Error while finding courses",
            });
        }
        return courses.map((course) => ({
            name: course.name,
            id: course._id.toHexString(),
            teacher: course.teacher,
            student_count: course.students.length,
        }));
    }

    // get courses from db
    // default value for search is undefined
    const [courses, coursesFindError] = await TutCourse.list(
        (skip ?? 0) as number,
        (limit ?? 10) as number,
    );
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

    const returnableArray = courses.map((course) => ({
        name: course.name,
        id: course._id.toHexString(),
        teacher: course.teacher as ObjectId | string,
        student_count: course.students.length,
    }));

    // now replace all teacher ids with their names
    await Promise.all(
        returnableArray.map(
            (v) =>
                new Promise<void>(async (resolve) => {
                    const [teacher, teacherFindError] = await User.getUserById(
                        v.teacher as ObjectId,
                    );
                    if (teacherFindError) {
                        resolve();
                        // we don't want to throw an error here
                        // because we want to return the courses
                        // even if the teacher is not found
                        // in worst case, there will be no teacher name for that course
                        return;
                    }
                    v.teacher = teacher.fullName ?? "No Teacher";
                    return resolve();
                }),
        ),
    );

    return returnableArray;
});
