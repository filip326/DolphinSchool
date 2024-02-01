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

    // todo add support ticket to database

    const [user, userErr] = await User.getUserByUsername(username);
    if (userErr || !user) {
        setTimeout(() => {
            throw createError({
                status: 400,
                message: "Invalid body",
            });
        }, 45000);
        return;
    }

    if (user.gebDate === gebDate) {
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
        setTimeout(() => {
            throw createError({
                status: 400,
                message: "Invalid body",
            });
        }, 45000);
        return;
    }
    if (!teacher.isTeacher()) {
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

    return {
        statusCode: 200,
    };
});
