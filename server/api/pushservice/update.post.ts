import PushNotificationDevice from "~/server/Dolphin/PushNotificationDevice";

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

    const { endpoint, keys, deviceName } = await readBody(event);
    if (!endpoint || !keys || !deviceName) {
        throw createError({
            statusMessage: "Bad request",
            statusCode: 400,
        });
    }
    if (
        typeof endpoint !== "string" ||
        typeof keys !== "object" ||
        typeof deviceName !== "string"
    ) {
        throw createError({
            statusMessage: "Bad request",
            statusCode: 400,
        });
    }

    if (
        "auth" in keys &&
        "p256dh" in keys &&
        typeof keys.auth === "string" &&
        typeof keys.p256dh === "string"
    ) {
        const [result, err] = await PushNotificationDevice.reregister(user._id, {
            endpoint,
            keys: {
                auth: keys.auth satisfies string,
                p256dh: keys.p256dh satisfies string,
            },
        });
        if (err) {
            throw createError({
                statusMessage: "Internal server error",
                statusCode: 500,
                fatal: true,
            });
        }
        if (!result) {
            throw createError({
                statusMessage: "Internal server error",
                statusCode: 500,
                fatal: true,
            });
        }
        return {
            success: result,
        };
    }
});
