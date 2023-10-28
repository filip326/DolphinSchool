import { ObjectId } from "mongodb";
import Mail, { Postfaecher } from "~/server/Dolphin/Mail/Mail";
import User from "~/server/Dolphin/User/User";

export default eventHandler(async (event) => {
    const checkAuthResult = await event.context.auth.checkAuth({});
    if (!checkAuthResult.success || !checkAuthResult.user) {
        throw createError({ statusCode: checkAuthResult.statusCode, message: "Failed" });
    }

    const { postfach } = getRouterParams(event);

    if (!postfach || typeof postfach != "string" || !checkValidPostfach(postfach)) {
        throw createError({ statusCode: 400, message: "Bad Request" });
    }

    const mailRes = await Mail.getMails({
        user: checkAuthResult.user._id,
        postfachSearch: {
            postfach: postfach as Postfaecher,
        },
    });

    if (!mailRes[0] || mailRes[1]) {
        throw createError({ statusCode: 500, message: mailRes[1] });
    }

    const mails: Array<{
        id: string;
        subject: string;
        content: string;
        sendBy: string;
        sentTo: string[];
        read?: boolean;
        stared?: boolean;
        timestamp: number;
    }> = await Promise.all(
        mailRes[0].map(async (mail) => {
            // get fullName of sendBy
            const sendByRes = await User.getUserById(mail.sendBy);
            if (!sendByRes[0] || sendByRes[1]) {
                throw createError({ statusCode: 500, message: "Failed" });
            }
            const sendBy: User = sendByRes[0];

            // get all fullNames of all users in sendTo
            const sendToPromise = mail.sendTo.map(async (userId) => {
                const userRes = await User.getUserById(new ObjectId(userId));
                if (!userRes[0] || userRes[1]) {
                    throw createError({ statusCode: 500, message: "Failed" });
                }
                return userRes[0].fullName;
            });

            const sendTos = await Promise.all(sendToPromise);

            const mails: {
                id: string;
                subject: string;
                content: string;
                sendBy: string;
                sentTo: string[];
                read?: boolean;
                stared?: boolean;
                timestamp: number;
            } = {
                id: mail.id.toString(),
                subject: mail.subject,
                content: mail.content,
                sendBy: sendBy.fullName,
                sentTo: sendTos,
                read: mail.read,
                stared: mail.stared,
                timestamp: mail.timestamp,
            };

            return mails;
        }),
    );
    return {
        success: true,
        mails: mails,
    };
});

function checkValidPostfach(postfach: string) {
    if (
        postfach == "inbox" ||
        postfach == "outbox" ||
        postfach == "stared" ||
        postfach == "unread"
    ) {
        return true;
    } else {
        return false;
    }
}
