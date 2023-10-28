import { ObjectId } from "mongodb";
import Course from "~/server/Dolphin/Course/Course";
import Message from "~/server/Dolphin/Messenger/Message";
import { Permissions } from "~/server/Dolphin/Permissions/PermissionManager";
import TutCourse from "~/server/Dolphin/Tut/TutCourse";
import User from "~/server/Dolphin/User/User";

export default eventHandler(async (event) => {
    const { success, user } = await event.context.auth.checkAuth({
        PermissionLevel: Permissions.SEND_MAIL,
    });
    if (!success || !user) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    const { sendTo, subject, content } = await readBody(event);
    if (
        !sendTo ||
        !subject ||
        !content ||
        !Array.isArray(sendTo) ||
        sendTo.length === 0 ||
        sendTo.some(
            (id) =>
                typeof id != "string" ||
                id.includes(":") ||
                ObjectId.isValid(id.split(":")[1]),
        ) || // check for each id if it is a string, including a column (:) and the part after the column is a valid ObjectId
        // examples: user:1234567890abcdef12345678, group:1234567890abcdef12345678
        typeof subject != "string" ||
        typeof content != "string"
    ) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
        });
    }

    const receiversText: string[] = [];
    const receiversIds: ObjectId[] = [];

    await Promise.all(
        sendTo.map(async (id) => {
            switch (id.split(":")[0]) {
                case "user":
                    // eslint-disable-next-line no-case-declarations
                    const [sendToUser, userFindError] = await User.getUserById(
                        new ObjectId(id.split(":")[1]),
                    );
                    if (userFindError) {
                        throw createError({
                            statusCode: 400,
                            statusMessage: "Bad Request",
                        });
                    }
                    receiversText.push(sendToUser.fullName);
                    receiversIds.push(sendToUser._id);
                    break;

                case "students_in_tut":
                    // eslint-disable-next-line no-case-declarations
                    const [tut, tutFindError] = await TutCourse.getTutCourseById(
                        new ObjectId(id.split(":")[1]),
                    );
                    if (tutFindError) {
                        throw createError({
                            statusCode: 400,
                            statusMessage: "Bad Request",
                        });
                    }
                    receiversText.push(`Schüler:innen in ${tut.name}`);
                    receiversIds.push(...tut.students);
                    // check for duplicates
                    receiversIds.filter(
                        (id, index) => receiversIds.indexOf(id) === index,
                    );
                    break;

                case "teachers_in_tut":
                    // eslint-disable-next-line no-case-declarations
                    const [tut2, tutFindError2] = await TutCourse.getTutCourseById(
                        new ObjectId(id.split(":")[1]),
                    );
                    if (tutFindError2) {
                        throw createError({
                            statusCode: 400,
                            statusMessage: "Bad Request",
                        });
                    }
                    receiversText.push(`Lehrer:innen in ${tut2.name}`);
                    receiversIds.push(tut2.teacher);
                    if (tut2.viceTeacher) receiversIds.push(tut2.viceTeacher);
                    // check for duplicates
                    receiversIds.filter(
                        (id, index) => receiversIds.indexOf(id) === index,
                    );
                    break;

                case "parents_in_tut":
                    // eslint-disable-next-line no-case-declarations
                    const [tut3, tutFindError3] = await TutCourse.getTutCourseById(
                        new ObjectId(id.split(":")[1]),
                    );
                    if (tutFindError3) {
                        throw createError({
                            statusCode: 400,
                            statusMessage: "Bad Request",
                        });
                    }
                    receiversText.push(`Eltern in ${tut3.name}`);
                    receiversIds.push(
                        ...(
                            await Promise.all(
                                tut3.students.map(async (studentId) => {
                                    const [student] = await User.getUserById(studentId);
                                    if (!student || !student.isStudent()) {
                                        throw createError({
                                            statusCode: 400,
                                            statusMessage: "Bad Request",
                                        });
                                    }
                                    return (await student.getParents())[0];
                                }),
                            )
                        )
                            .filter((value) => value != undefined)
                            .flat()
                            .map((value) => value!._id), // exclamation mark because we filtered out undefined values two lines above already.
                    );
                    // check for duplicates
                    receiversIds.filter(
                        (id, index) => receiversIds.indexOf(id) === index,
                    );
                    break;

                case "teachers_in_course":
                    // eslint-disable-next-line no-case-declarations
                    const [course, courseFindError] = await Course.getById(
                        new ObjectId(id.split(":")[1]),
                    );
                    if (courseFindError) {
                        throw createError({
                            statusCode: 400,
                            statusMessage: "Bad Request",
                        });
                    }
                    receiversText.push(`Lehrer:innen in ${course.name}`);
                    receiversIds.push(...course.teacher);
                    // check for duplicates
                    receiversIds.filter(
                        (id, index) => receiversIds.indexOf(id) === index,
                    );
                    break;

                case "students_in_course":
                    // eslint-disable-next-line no-case-declarations
                    const [course2, courseFindError2] = await Course.getById(
                        new ObjectId(id.split(":")[1]),
                    );
                    if (courseFindError2) {
                        throw createError({
                            statusCode: 400,
                            statusMessage: "Bad Request",
                        });
                    }
                    receiversText.push(`Schüler:innen in ${course2.name}`);
                    receiversIds.push(...course2.students);
                    // check for duplicates
                    receiversIds.filter(
                        (id, index) => receiversIds.indexOf(id) === index,
                    );
                    break;

                case "parents_in_course":
                    // eslint-disable-next-line no-case-declarations
                    const [course3, courseFindError3] = await Course.getById(
                        new ObjectId(id.split(":")[1]),
                    );
                    if (courseFindError3) {
                        throw createError({
                            statusCode: 400,
                            statusMessage: "Bad Request",
                        });
                    }
                    receiversText.push(`Eltern in ${course3.name}`);
                    receiversIds.push(
                        ...(
                            await Promise.all(
                                course3.students.map(async (studentId) => {
                                    const [student] = await User.getUserById(studentId);
                                    if (!student || !student.isStudent()) {
                                        throw createError({
                                            statusCode: 400,
                                            statusMessage: "Bad Request",
                                        });
                                    }
                                    return (await student.getParents())[0];
                                }),
                            )
                        )
                            .filter((value) => value != undefined)
                            .flat()
                            .map((value) => value!._id), // exclamation mark because we filtered out undefined values two lines above already.
                    );
                    // check for duplicates
                    receiversIds.filter(
                        (id, index) => receiversIds.indexOf(id) === index,
                    );
                    break;

                default:
                    throw createError({
                        statusCode: 400,
                        statusMessage: "Bad Request",
                    });
            }
        }),
    );

    // create the Message
    const [createMessage, createMessageError] = await Message.createMessage({
        content,
        subject,
        sender: user._id,
        receivers: receiversText.join(", "),
    });

    if (!result[0] || result[1]) {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
        });
    } else {
        return {
            statusCode: 200,
        };
    }
});
