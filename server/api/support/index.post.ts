import SupportManager from "~/server/Dolphin/Support/SupportManager";
import User from "~/server/Dolphin/User/User";

// sends every response after 45 seconds
export default defineEventHandler(async (event) => {
    const { username, krz, gebDate } = await readBody(event);

    if (!username || !krz || !gebDate) {
        throw createError({
            status: 400,
            message: "Invalid body",
        });
    }
    if (
        typeof username !== "string" ||
        typeof krz !== "string" ||
        typeof gebDate !== "string"
    ) {
        setTimeout(() => {
            throw createError({
                status: 400,
                message: "Invalid body",
            });
        }, 45000);
        return;
    }

    if (await SupportManager.supportBruthforceProtection(username)) {
        setTimeout(() => {
            throw createError({
                status: 400,
                message: "Invalid body",
            });
        }, 45000);
        return;
    }

    const [user, userErr] = await User.getUserByUsername(username);
    if (userErr || !user) {
        await SupportManager.createFailedSupport(username, krz, gebDate);
        setTimeout(() => {
            throw createError({
                status: 400,
                message: "Invalid body",
            });
        }, 45000);
        return;
    }

    if (user.gebDate === gebDate) {
        await SupportManager.createFailedSupport(username, krz, gebDate);
        setTimeout(() => {
            throw createError({
                status: 400,
                message: "Invalid body",
            });
        }, 45000);
        return;
    }

    const [teacher, teacherErr] = await User.getUserByKrz(krz);
    if (teacherErr || !teacher) {
        await SupportManager.createFailedSupport(username, krz, gebDate);
        setTimeout(() => {
            throw createError({
                status: 400,
                message: "Invalid body",
            });
        }, 45000);
        return;
    }
    if (!teacher.isTeacher()) {
        await SupportManager.createFailedSupport(username, krz, gebDate);
        setTimeout(() => {
            throw createError({
                status: 400,
                message: "Invalid body",
            });
        }, 45000);
        return;
    }

    // todo: check if mail in user. if then send mail. if not:
    // todo: add request to reset pwd to database

    const supportObj = await SupportManager.createSupport(username, krz, gebDate);

    return {
        statusCode: 200,
        inserted: supportObj,
    };
});
