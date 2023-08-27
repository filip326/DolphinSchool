import { ObjectId } from "mongodb";
import Subject from "../../../Dolphin/Course/Subject";

export default defineEventHandler(async (event) => {
    if (
        !event.context.auth.authenticated ||
        event.context.auth.mfa_required ||
        !event.context.auth.user
    ) {
        throw createError({ statusCode: 401, message: "Unauthorized", });
    }

    const { id, } = getRouterParams(event);

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

    const [subject, subjectFindError,] = await Subject.getSubjectById(ObjectId.createFromHexString(id));

    if (subjectFindError || !subject) {
        return createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
        });
    }

    const [deleteResult, deleteError,] = await subject.delete();

    if (deleteError) {
        return createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
        });
    }

    return deleteResult ? "Ok" : createError({
        statusCode: 500,
        statusMessage: "Internal Server Error",
    });
});