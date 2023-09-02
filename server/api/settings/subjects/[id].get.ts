import { ObjectId } from "mongodb";
import Subject from "../../../Dolphin/Course/Subject";

export default defineEventHandler(async (event) => {
    // check authentication
    const checkAuthResult = await event.context.auth.checkAuth(event, {});
    if (!checkAuthResult.success || !checkAuthResult.user) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    // send subject with id
    const { id } = getRouterParams(event);

    if (!id) {
        return createError({
            statusCode: 400,
            statusMessage: "Bad Request",
        });
    }

    if (!ObjectId.isValid(id)) {
        return createError({
            statusCode: 400,
            statusMessage: "Bad Request",
        });
    }

    const [subject, subjectFindError] = await Subject.getSubjectById(
        ObjectId.createFromHexString(id),
    );

    if (subjectFindError) {
        return createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
        });
    }

    if (!subject) {
        return createError({
            statusCode: 404,
            statusMessage: "Not Found",
        });
    }

    return {
        id: subject._id,
        longName: subject.longName,
        short: subject.short,
        main: subject.main,
    };
});
