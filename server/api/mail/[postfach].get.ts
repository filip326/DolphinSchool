import Message from "~/server/Dolphin/Messenger/Message";
import UserMessage from "~/server/Dolphin/Messenger/UserMessage";

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
            return userMessages.map((userMessage) => ({
                id: userMessage._id,
                subject: userMessage.subject,
                sender: userMessage.author,
                timestemp: userMessage.time.getTime(),
                stared: userMessage.stared,
                read: userMessage.read,
            }));
        case "inbox":
            console.log(`looking up mails in inbox for user ${checkAuthResult.user._id}`);
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
            console.log(
                `found ${userMessagesInbox.length} mails in inbox for user ${checkAuthResult.user._id}`,
            );
            return userMessagesInbox.map((userMessage) => ({
                id: userMessage._id,
                subject: userMessage.subject,
                sender: userMessage.author,
                timestemp: userMessage.time.getTime(),
                stared: userMessage.stared,
                read: userMessage.read,
            }));

        case "outbox":
            // eslint-disable-next-line no-case-declarations
            const [messages, messagesListError] = await Message.listMessagesBySender(
                checkAuthResult.user._id,
                { limit, skip },
            );
            if (messagesListError) {
                throw createError({ statusCode: 500, message: "Failed" });
            }
            return messages.map((message) => ({
                id: message._id,
                subject: message._subject,
                sender: message.sender,
                timestemp: message.time.getTime(),
                stared: false,
                flag: "outgoing",
                read: true,
            }));

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
            return userMessagesStared.map((userMessage) => ({
                id: userMessage._id,
                subject: userMessage.subject,
                sender: userMessage.author,
                timestemp: userMessage.time.getTime(),
                stared: userMessage.stared,
                read: userMessage.read,
            }));
    }
});
