import Subject from "../../Dolphin/Course/Subject";

export default defineEventHandler(async (event) => {
    // check authentication
    const checkAuthResult = await event.context.auth.checkAuth(event, {});
    if (!checkAuthResult.success || !checkAuthResult.user) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    // send subject list
    const [subjects, subjectListError] = await Subject.list();
    if (subjectListError || !subjects) {
        return createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
        });
    }

    return subjects.map((subject) => ({
        id: subject._id,
        longName: subject.longName,
        short: subject.short,
        main: subject.main,
    }));
});
