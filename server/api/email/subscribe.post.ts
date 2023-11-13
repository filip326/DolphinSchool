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

    const { email } = await readBody(event);

    if (!email) {
        throw createError({
            statusMessage: "Bad request",
            statusCode: 400,
        });
    }

    if (typeof email !== "string") {
        throw createError({
            statusMessage: "Bad request",
            statusCode: 400,
        });
    }

    // check email against regex
    const emailRegex = /^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
        throw createError({
            statusMessage: "Bad request",
            statusCode: 400,
        });
    }

    // register the email
    const [emailNotification, err] = await EmailNotification.subscribe(user._id, email);
    if (err) {
        throw createError({
            statusMessage: "Internal server error",
            statusCode: 500,
            fatal: true,
        });
    }

    if (!emailNotification) {
        throw createError({
            statusMessage: "Internal server error",
            statusCode: 500,
            fatal: true,
        });
    }

    // respond success to the client
    // ! dont send the verification code to the client, this is a security risk
    return {
        success: true,
    };
});
