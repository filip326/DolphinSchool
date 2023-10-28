import { ObjectId } from "mongodb";
import Mail from "~/server/Dolphin/Mail/Mail";
import User from "~/server/Dolphin/User/User";

export default eventHandler(async (event) => {
    const checkAuthResult = await event.context.auth.checkAuth({});
    if (!checkAuthResult.success || !checkAuthResult.user) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    const { id } = getRouterParams(event);

    // get the Mail
    const mail = await Mail.getMail(new ObjectId(id), checkAuthResult.user._id);
    if (!mail[0] || mail[1]) {
        throw createError({ statusCode: 404, message: "Not Found" });
    }

    if (
        !mailWasSentToUser(mail[0], checkAuthResult.user._id) &&
        !mail[0].sendBy.equals(checkAuthResult.user._id)
    ) {
        throw createError({ statusCode: 403, message: "Forbidden" });
    }

    return {
        success: true,
        mail: await processMail(mail[0]),
    };
});

async function processMail(mail: Mail) {
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
}

function mailWasSentToUser(mail: Mail, userId: ObjectId) {
    return mail.sendTo.some((id: ObjectId) => userId.equals(id));
}
