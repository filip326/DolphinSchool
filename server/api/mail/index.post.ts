import Mail from "~/server/Dolphin/Mail/Mail";
import { Permissions } from "~/server/Dolphin/Permissions/PermissionManager";

export default eventHandler(async (event) => {
    const { success, user } = await event.context.auth.checkAuth({
        PermissionLevel: Permissions.SEND_MAIL,
    });
    if (!success || !user) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    const { sendTo, subject, content } = await readBody(event);
    if (
        !sendTo ||
        !subject ||
        !content ||
        typeof sendTo != "object" ||
        !Array.isArray(sendTo) ||
        sendTo.length === 0 ||
        typeof subject != "string" ||
        typeof content != "string"
    ) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
        });
    }

    const result = await Mail.createMail({
        sendBy: user._id,
        sendTo,
        subject,
        content,
    });

    if (!result[0] || result[1]) {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
        });
    } else {
        return {
            statusCode: 200,
        };
    }
});
