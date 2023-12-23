import { ObjectId } from "mongodb";
import ASMSQ from "~/server/Dolphin/ASMSQ/ASMSQ";
import Message from "~/server/Dolphin/Messenger/Message";
import UserMessage from "~/server/Dolphin/Messenger/UserMessage";
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

    const { sendTo, subject, content, newsletter } = await readBody(event);
    if (
        !sendTo ||
        !subject ||
        !content ||
        !Array.isArray(sendTo) ||
        sendTo.length === 0 ||
        sendTo.some(
            (id) =>
                typeof id != "string" ||
                !id.includes(":") ||
                !ObjectId.isValid(id.split(":")[1]),
        ) || // check for each id if it is a string, including a column (:) and the part after the column is a valid ObjectId
        // examples: user:1234567890abcdef12345678, group:1234567890abcdef12345678
        typeof subject != "string" ||
        typeof content != "string" ||
        // newsletter is optional, but if it is provided, it must be a boolean
        (newsletter != undefined && typeof newsletter !== "boolean")
    ) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
        });
    }

    const [ [ receiversIds ], [ receiversText ] ] = await Promise.all([
        ASMSQ.toUserIds(sendTo),
        ASMSQ.toText(sendTo),
    ]);

    if (!receiversIds || !receiversText) {
        throw createError({ 
            statusCode: 400,
            statusMessage: "Bad Request",
        });
    }

    // create the Message
    const [createMessage, createMessageError] = await Message.createMessage({
        content,
        subject,
        sender: user._id,
        receivers: receiversText,
    });

    if (createMessageError) {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
        });
    }

    for await (const receiverId of receiversIds) {
        // now create a user message
        const createUserMessageError = (
            await UserMessage.sendMessage(receiverId, createMessage)
        )[1];
        if (createUserMessageError) {
            // undo the message creation by deleting each user message and the message itself bc an error occured
            // else, the message would be visible to some users but not all of them. this would be confusing. to prevent this, we delete the message to evryone and ask the user to try again.
            await createMessage.delete();

            throw createError({
                statusCode: 500,
                statusMessage: "Internal Server Error",
            });
        }
    }

    // TODO: #53 send email notifications / push notifications to users

    return {
        statusCode: 200,
        statusMessage: "OK",
        body: {
            success: true,
        },
    };
});
