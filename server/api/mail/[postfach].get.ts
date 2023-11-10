import Message from "~/server/Dolphin/Messenger/Message";
import UserMessage from "~/server/Dolphin/Messenger/UserMessage";
import User from "~/server/Dolphin/User/User";
import { ObjectId } from "mongodb";

export default eventHandler(async (event) => {
    const checkAuthResult = await event.context.auth.checkAuth({});
    if (!checkAuthResult.success || !checkAuthResult.user) {
        throw createError({ statusCode: checkAuthResult.statusCode, message: "Failed" });
    }

    const { postfach } = getRouterParams(event);
    let { limit, skip } = getQuery(event);
    if (!skip || typeof skip !== "number") {
        skip = 0;
    }
    if (!limit || typeof limit !== "number" || limit > 25) {
        limit = 25;
    }

    let foundMessages: {
        id: ObjectId;
        subject: string;
        sender: ObjectId | string;
        timestemp: number;
        stared: boolean;
        flag?: "incoming" | "outgoing";
        read: boolean;
    }[] = [];

    switch (postfach) {
        case "unread":
            // eslint-disable-next-line no-case-declarations
            const [userMessages, userMessagesListError] =
                await UserMessage.listUsersMessages(
                    checkAuthResult.user,
                    {
                        limit,
                        skip,
                    },
                    { read: false },
                );
            if (userMessagesListError) {
                throw createError({ statusCode: 500, message: "Failed" });
            }
            foundMessages = userMessages.map((userMessage) => ({
                id: userMessage._id,
                subject: userMessage.subject,
                sender: userMessage.author,
                timestemp: userMessage.time.getTime(),
                stared: userMessage.stared,
                read: userMessage.read,
            }));
            break;
        case "inbox":
            // eslint-disable-next-line no-case-declarations
            const [userMessagesInbox, userMessagesInboxListError] =
                await UserMessage.listUsersMessages(
                    checkAuthResult.user,
                    {
                        limit,
                        skip,
                    },
                    {},
                );
            if (userMessagesInboxListError) {
                throw createError({ statusCode: 500, message: "Failed" });
            }
            foundMessages = userMessagesInbox.map((userMessage) => ({
                id: userMessage._id,
                subject: userMessage.subject,
                sender: userMessage.author,
                timestemp: userMessage.time.getTime(),
                stared: userMessage.stared,
                read: userMessage.read,
            }));
            break;

        case "outbox":
            // eslint-disable-next-line no-case-declarations
            const [messages, messagesListError] = await Message.listMessagesBySender(
                checkAuthResult.user._id,
                { limit, skip },
            );
            if (messagesListError) {
                throw createError({ statusCode: 500, message: "Failed" });
            }
            foundMessages = messages.map((message) => ({
                id: message._id,
                subject: message._subject,
                sender: message.sender,
                timestemp: message.time.getTime(),
                stared: false,
                flag: "outgoing",
                read: true,
            }));
            break;

        case "stared":
            // eslint-disable-next-line no-case-declarations
            const [userMessagesStared, userMessagesStaredListError] =
                await UserMessage.listUsersMessages(
                    checkAuthResult.user,
                    {
                        limit,
                        skip,
                    },
                    { stared: true },
                );
            if (userMessagesStaredListError) {
                throw createError({ statusCode: 500, message: "Failed" });
            }
            foundMessages = userMessagesStared.map((userMessage) => ({
                id: userMessage._id,
                subject: userMessage.subject,
                sender: userMessage.author,
                timestemp: userMessage.time.getTime(),
                stared: userMessage.stared,
                read: userMessage.read,
            }));
            break;
    }

    await Promise.all(
        foundMessages.map(async (msg, i) => {
            // get user with id msg.sender
            const [sender, senderFindError] = await User.getUserById(
                new ObjectId(msg.sender),
            );
            if (senderFindError) {
                throw createError({ statusCode: 500, message: "Failed" });
            }
            if (!sender) {
                throw createError({ statusCode: 500, message: "Failed" });
            }
            // replace id with full name
            foundMessages[i].sender = sender.fullName;
        }),
    );

    return foundMessages;
});
