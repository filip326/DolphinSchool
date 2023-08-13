import checkAuth from "@/server/composables/checkAuth";
import Subject from "../../Dolphin/Course/Subject";

export default defineEventHandler(async (event) => {
    
    // check authentication
    const authError = (await checkAuth(event))[1];

    if (authError) {
        return createError({
            statusCode: 401,
            statusMessage: "Unauthorized"
        });
    }

    // send subject list
    const [ subjects, subjectListError ] = await Subject.list();
    if (subjectListError) {
        return createError({
            statusCode: 500,
            statusMessage: "Internal Server Error"
        });
    }

    return subjects.map(subject => ({
        id: subject._id,
        longName: subject.longName,
        short: subject.short,
        main: subject.main,
    }));

});