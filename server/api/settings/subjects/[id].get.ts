import { ObjectId } from "mongodb";
import Subject from "../../../Dolphin/Course/Subject";
import checkAuth from "@/server/composables/checkAuth";


export default defineEventHandler(async (event) => {

    // check authentication
    const authError = (await checkAuth(event))[1];

    if (authError) {
        return createError({
            statusCode: 401,
            statusMessage: "Unauthorized"
        });
    }

    // send subject with id
    const { id } = getRouterParams(event);

    if (!id) {
        return createError({
            statusCode: 400,
            statusMessage: "Bad Request"
        });
    }

    if (!ObjectId.isValid(id)) {
        return createError({
            statusCode: 400,
            statusMessage: "Bad Request"
        });
    }

    const [subject, subjectFindError] = await Subject.getSubjectById(ObjectId.createFromHexString(id));

    if (subjectFindError) {
        return createError({
            statusCode: 500,
            statusMessage: "Internal Server Error"
        });
    }

    if (!subject) {
        return createError({
            statusCode: 404,
            statusMessage: "Not Found"
        });
    }

    return {
        id: subject._id,
        longName: subject.longName,
        short: subject.short,
        main: subject.main,
    };


});