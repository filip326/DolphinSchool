import { ObjectId } from "mongodb";
import Subject from "../../../Dolphin/Course/Subject";
import { Permissions } from "../../../Dolphin/Permissions/PermissionManager";
import checkAuth from "@/server/composables/checkAuth";

export default defineEventHandler(async (event) => {

    const authError = (await checkAuth(event, { requirePerm: Permissions.MANAGE_SUBJECTS, throwErrOnAuthFail: true }))[1];
    if (authError) {
        return authError;
    }

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

    if (subjectFindError || !subject) {
        return createError({
            statusCode: 500,
            statusMessage: "Internal Server Error"
        });
    }

    const [deleteResult, deleteError] = await subject.delete();

    if (deleteError) {
        return createError({
            statusCode: 500,
            statusMessage: "Internal Server Error"
        });
    }

    return deleteResult ? "Ok" : createError({
        statusCode: 500,
        statusMessage: "Internal Server Error"
    });
});