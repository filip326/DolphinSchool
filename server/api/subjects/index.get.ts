import Subject from "~/server/Dolphin/Course/Subject";

export default defineEventHandler(async (event) => {
    const { success, statusCode } = await event.context.auth.checkAuth();
    if (!success) {
        throw createError({
            statusCode: statusCode,
        });
    }

    // check if there is a string query param "search"
    const { search } = getQuery(event);

    if (typeof search === "string") {
        const [subjects, error] = await Subject.search(search);
        if (error) {
            throw createError({
                statusCode: 500,
                message: "Internal server error",
            });
        }
        return subjects.map((subject) => ({
            _id: subject._id.toHexString(),
            longName: subject.longName,
            short: subject.short,
        }));
    }
});
