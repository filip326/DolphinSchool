import EmailNotification from "~/server/Dolphin/EMailNotification";

export default defineEventHandler(async (event) => {
    const { success, statusCode, user } = await event.context.auth.checkAuth();
    if (!success) {
        throw createError({
            statusMessage: "Unauthorized",
            statusCode: statusCode,
        });
    }
    if (!user) {
        throw createError({
            statusMessage: "Unauthorized",
            statusCode: 401,
        });
    }

    const { code } = await readBody(event);
    if (!code) {
        throw createError({
            statusMessage: "Bad request",
            statusCode: 400,
        });
    }
    if (typeof code !== "string") {
        throw createError({
            statusMessage: "Bad request",
            statusCode: 400,
        });
    }

    const [email, err] = await EmailNotification.getByUser(user._id);
    if (err || !email) {
        throw createError({
            statusMessage: "Internal server error",
            statusCode: 500,
            fatal: true,
        });
    }

    if (email.verified) {
        throw createError({
            statusMessage: "Bad request",
            statusCode: 400,
        });
    }

    const [verified, err2] = await email.verifiy(code);

    if (err2 || !verified) {
        return {
            success: false,
            newCodeCreated: email.verificationAttempts === 0,
        };
    }

    return {
        success: true,
        newCodeCreated: false,
    };
});
