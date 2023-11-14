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

    const [email, err] = await EmailNotification.getByUser(user._id);
    if (err || !email) {
        return {
            subscribed: false,
            verified: false,
            email: null,
        };
    }

    let emailToDisplay = "";
    // first two letters + x stars + @ + first letter of domain + .tld

    const firstPartOfEmail = email.email.split("@")[0];
    const domain = email.email.split("@")[1].split(".")[0];
    const tld = email.email.split("@")[1].split(".")[1];

    emailToDisplay =
        firstPartOfEmail.substring(0, 2) +
        "*".repeat(firstPartOfEmail.length - 2) +
        "@" +
        domain.substring(0, 1) +
        "*".repeat(domain.length - 1) +
        "." +
        tld;

    if (email.verified) {
        return {
            subscribed: true,
            verified: true,
            email: emailToDisplay,
        };
    } else {
        return {
            subscribed: true,
            verified: false,
            email: emailToDisplay,
        };
    }
});
