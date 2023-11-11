import Subject from "~/server/Dolphin/Course/Subject";

export default defineEventHandler(async (event) => {
    // check for permission
    const { success, statusCode } = await event.context.auth.checkAuth({});

    if (!success) {
        throw createError({ statusCode });
    }

    // get the subjects
    const [subjects, subjectError] = await Subject.list();

    if (subjectError) {
        throw createError({ statusCode: 500 });
    }

    // return the subjects
    return subjects.map((subject) => ({
        id: subject._id.toHexString(),
        name: subject.longName,
    }));
});
