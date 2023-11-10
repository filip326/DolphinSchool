import { ObjectId } from "mongodb";
import Message from "~/server/Dolphin/Messenger/Message";
import UserMessage from "~/server/Dolphin/Messenger/UserMessage";
import User from "~/server/Dolphin/User/User";

export default eventHandler(async (event) => {
    const { success, statusCode, user } = await event.context.auth.checkAuth();

    if (!success || !user) {
        throw createError({
            statusCode,
        });
    }

    const id = getRouterParam(event, "id");

    if (!id) {
        throw createError({
            statusCode: 404,
        });
    }

    if (!ObjectId.isValid(id)) {
        throw createError({
            statusCode: 400,
        });
    }

    const targetId = new ObjectId(id);

    // there are two options, either
    // - the specified id points to a message
    // - the specified id points to a user message

    const message = await Promise.race([
        new Promise<Message>(async (resolve, reject) => {
            // look for a message

            const [message, messageFindError] = await Message.getMessageById(targetId);
            if (messageFindError) {
                // dont throw an error, maybe the id points to a user message
                return;
            }

            if (!message) {
                // dont throw an error, maybe the id points to a user message
                return;
            }

            // now we know that the id points to a message
            // we need to check if the user has access to this message
            // the user has access to this message if
            // - either the user is the author of the message
            if (message.sender.equals(user._id)) {
                return resolve(message);
            }
            // - or there is a user message that points to this message and is owned by the user
            const [userMessage, userMessageFindError] =
                await UserMessage.getUserMessagesByMessageId(message._id, user._id);
            if (userMessageFindError) {
                // now we know that the id points to a message, but the user has no access to it
                reject(
                    createError({
                        statusCode: 403,
                    }),
                );
                return;
            }
            if (!userMessage || userMessage.length === 0) {
                // now we know that the id points to a message, but the user has no access to it
                reject(
                    createError({
                        statusCode: 403,
                    }),
                );
                return;
            }
            // since the user message was requested by the user, it is read now
            userMessage[0].markAsRead(true);

            // now we know that the id points to a message and the user has access to it
            resolve(message);
        }),
        new Promise<Message>(async (resolve, reject) => {
            // look for a user message and then turn it into a message
            const [userMessage, userMessageFindError] =
                await UserMessage.getUserMessageById(targetId);
            if (userMessageFindError) {
                // dont throw an error, maybe the id points to a message
                return;
            }
            if (!userMessage) {
                // dont throw an error, maybe the id points to a message
                return;
            }
            // now we know that the id points to a user message
            // the user has access to this user message if he is the owner of it
            if (!userMessage.owner.equals(user._id)) {
                // now we know that the id points to a user message, but the user has no access to it
                reject(
                    createError({
                        statusCode: 403,
                    }),
                );
                return;
            }
            // since the user message was requested by the user, it is read now
            userMessage.markAsRead(true);
            // now we know that the id points to a user message and the user has access to it
            // we need to turn the user message into a message
            const [message, messageFindError] = await Message.getMessageById(
                userMessage.message,
            );
            if (messageFindError) {
                // now we know that the id points to a user message, but the user has no access to it
                reject(
                    createError({
                        statusCode: 403,
                    }),
                );
                return;
            }
            if (!message) {
                // now we know that the id points to a user message, but the user has no access to it
                reject(
                    createError({
                        statusCode: 403,
                    }),
                );
                return;
            }
            // now we know that the id points to a user message and the user has access to it
            resolve(message);
        }),
        new Promise<Message>((resolves, rejects) => {
            // timeout after 5 seconds
            setTimeout(() => {
                rejects(
                    createError({
                        statusCode: 500,
                    }),
                );
            }, 5000);
        }),
    ]);

    // get authors real name to not show his id
    const [author, authorFindError] = await User.getUserById(message.sender);
    if (authorFindError) {
        throw createError({
            statusCode: 500,
        });
    }

    return {
        _id: message._id,
        sender: author.fullName,
        receivers: message.receivers,
        subject: message._subject,
        content: message.content,
        time: message.time.getTime(),
    };
});
