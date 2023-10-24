import { ObjectId } from "mongodb";
import Course, {
    CreateCourseOptions,
    CreateSingleClassCourseOptions,
} from "~/server/Dolphin/Course/Course";
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

    // fisrt get the body from the request and check if it is valid
    const body = await readBody(event);

    // check if body contains everything from the CourseCreateOptions
    /* type CreateCourseOptions = {
        type: "LK" | "GK" | "single-class" | "out-of-class";
        teacher: ObjectId[];
        subject: ObjectId;
        schoolYear: ICourse["schoolYear"];
        semester: ICourse["semester"];
        grade: ICourse["grade"];
        number?: ICourse["number"];
    };
    
    type CreateSingleClassCourseOptions = CreateCourseOptions & {
        type: "single-class";
        linkedTuts: [ObjectId];
    }; */

    // first check for a valid type
    if (!("type" in body) || !["LK", "GK", "single-class", "out-of-class"].includes(body.type)) {
        throw createError({
            statusCode: 400,
            message: "Invalid body - type is missing",
        });
    }

    // then check for a valid teacher
    // the teacher is an string array. each string is an hexademical string of an ObjectId
    if (
        !("teacher" in body) ||
        !Array.isArray(body.teacher) ||
        body.teacher.some(
            (teacher: any) => typeof teacher !== "string" || !ObjectId.isValid(teacher),
        )
    ) {
        throw createError({
            statusCode: 400,
            message: "Invalid body - teacher is missing",
        });
    }

    for await (const teacher of body.teacher as string[]) {
        const [teacherObj, teacherFindError] = await User.getUserById(
            ObjectId.createFromHexString(teacher as string),
        );
        if (teacherFindError) {
            throw createError({
                statusCode: 400,
                message: "Invalid body - teacher is missing",
            });
        }
        if (!teacherObj?.isTeacher()) {
            throw createError({
                statusCode: 400,
                message: "Invalid body - teacher is not a teacher",
            });
        }
    }

    if (body.teacher.length === 0) {
        throw createError({
            statusCode: 400,
            message: "Invalid body - teacher is missing",
        });
    }

    // then check for a valid subject
    // the subject is an hexademical string of an ObjectId
    if (
        !("subject" in body) ||
        typeof body.subject !== "string" ||
        !ObjectId.isValid(body.subject)
    ) {
        throw createError({
            statusCode: 400,
            message: "Invalid body - subject is missing",
        });
    }
    const [subject, subjectFindError] = await User.getUserById(
        ObjectId.createFromHexString(body.subject),
    );
    if (subjectFindError) {
        throw createError({
            statusCode: 400,
            message: "Invalid body - subject is missing",
        });
    }

    // then check for a valid schoolYear
    // the schoolYear is an number
    // if there is no schoolYear specified, the current schoolYear is used
    // current schoolYear is the year of the current date in the format yyyy from 1. august to 31. december and yyyy-1 from 1. january to 31. july
    let schoolYear: number;
    if (!("schoolYear" in body) || typeof body.schoolYear !== "number") {
        schoolYear = new Date().getFullYear();
        if (new Date().getMonth() <= 6) {
            schoolYear--;
        }
    } else {
        schoolYear = body.schoolYear as number;
    }

    // then check for a valid semester
    // the semester is an number 0, 1 or 2
    // default: 0
    let semester: 0 | 1 | 2;
    if (
        !("semester" in body) ||
        typeof body.semester !== "number" ||
        ![0, 1, 2].includes(body.semester)
    ) {
        semester = 0;
    } else {
        semester = body.semester as 0 | 1 | 2;
    }

    // then check for a valid grade
    // the grade is an number 5 to 13
    // no default value; must be specified
    if (
        !("grade" in body) ||
        typeof body.grade !== "number" ||
        ![5, 6, 7, 8, 9, 10, 11, 12, 13].includes(body.grade)
    ) {
        throw createError({
            statusCode: 400,
            message: "Invalid body - grade is missing",
        });
    }

    // if type is LK or GK, check for a valid number
    // a valid number is any integer greater than 0
    // if type is not LK or GK, number is neiter required nor used
    // no default value; must be specified
    let number: number | undefined;
    if (body.type === "LK" || body.type === "GK") {
        if (
            !("number" in body) ||
            typeof body.number !== "number" ||
            !Number.isInteger(body.number) ||
            body.number <= 0
        ) {
            throw createError({
                statusCode: 400,
                message: "Invalid body - number is missing",
            });
        }
        number = body.number;
    }

    // if type is single-class, check for a valid linkedTuts
    // the linkedTut is a hexademical string of an ObjectId
    // if type is not single-class, linkedTut is neiter required nor used
    if (body.type === "single-class") {
        if (
            !("linkedTuts" in body) ||
            !Array.isArray(body.linkedTuts) ||
            body.linkedTuts.some(
                (linkedTut: any) => typeof linkedTut !== "string" || !ObjectId.isValid(linkedTut),
            )
        ) {
            throw createError({
                statusCode: 400,
                message: "Invalid body - linkedTuts is missing",
            });
        }
        if (body.linkedTuts.length !== 1) {
            throw createError({
                statusCode: 400,
                message: "Invalid body - linkedTut needs to be an array with exactly one element",
            });
        }

        const [linkedTut, linkedTutFindError] = await TutCourse.getTutCourseById(
            ObjectId.createFromHexString(body.linkedTuts[0]),
        );
        if (linkedTutFindError) {
            throw createError({
                statusCode: 400,
                message: "Invalid body - linkedTut is missing",
            });
        }

        // create the course now
        const courseCreateOptions: CreateSingleClassCourseOptions = {
            type: body.type,
            teacher: body.teacher.map((teacher: string) => ObjectId.createFromHexString(teacher)),
            subject: subject._id,
            schoolYear,
            semester,
            grade: body.grade,
            linkedTuts: [linkedTut._id],
        };
        const [courseCreate, courseCreateError] = await Course.create(courseCreateOptions);
        if (courseCreateError) {
            throw createError({
                statusCode: 500,
                message: "Error while creating course",
            });
        }

        return {
            name: courseCreate.name,
            id: courseCreate._id.toHexString(),
        };
    }

    // else create the course without linkedTuts
    const courseCreateOptions: CreateCourseOptions = {
        type: body.type,
        teacher: body.teacher.map((teacher: string) => ObjectId.createFromHexString(teacher)),
        subject: subject._id,
        schoolYear,
        semester,
        grade: body.grade,
        number,
    };
    const [courseCreate, courseCreateError] = await Course.create(courseCreateOptions);
    if (courseCreateError) {
        throw createError({
            statusCode: 500,
            message: "Error while creating course",
        });
    }

    return {
        name: courseCreate.name,
        id: courseCreate._id.toHexString(),
    };
});
