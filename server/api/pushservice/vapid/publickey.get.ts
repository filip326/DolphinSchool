import Setting from "~/server/Dolphin/Settings";
import { VapidKeys } from "web-push";

export default defineEventHandler(async () => {
    // send the public key to the client
    // since it is a public key, we don't need to check auth

    const vapidKeys = await Setting.get<VapidKeys>("vapidKeys");
    if (!vapidKeys) {
        throw createError({
            statusMessage: "Internal server error",
            statusCode: 500,
            fatal: true,
        });
    }

    return {
        publicKey: vapidKeys.publicKey,
    };
});
