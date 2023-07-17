
// get all mails

import Dolphin from "../../Dolphin/Dolphin";

export default defineEventHandler(async (event) => {

    // check authentication
    if (!event.context.auth.authenticated || event.context.auth.mfa_required || !event.context.auth.user) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    // get user object
    const user = event.context.auth.user;

    const query = getQuery(event);

    // get limit and skip from query
    const limit = parseInt(query.limit as string) || 15;
    const skip = parseInt(query.skip as string) || 0;

    // get dolphin
    const dolphin = Dolphin.instance ?? await Dolphin.init();
    
    // get mailbox
    const [ userMessageManager, userMessageManagerError ] = await dolphin.getMessenger(user);
    if (userMessageManagerError) {
        throw createError({ statusCode: 500, message: "Internal server error" });
    }

    // get mails
    const [mails, mailsError] = await userMessageManager.getMessages({
        limit,
        skip,
    })

    if (mailsError) {
        throw createError({ statusCode: 500, message: "Internal server error" });
    }

    // return mails
    return mails.map(mail => ({
        id: mail.message.toHexString(),
        subject: mail.subject,
        author: mail.author.toHexString(),
    }));


});