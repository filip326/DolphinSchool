import PushNotificationDevice from "../../Dolphin/PushNotificationDevice";

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

    const [result, err] = await PushNotificationDevice.getDevice(user._id);
    if (err) {
        return {
            deviceFound: false,
        };
    }

    const [result2, err2] = await result.unregister();
    if (err2) {
        throw createError({
            statusMessage: "Internal server error",
            statusCode: 500,
            fatal: true,
        });
    }

    if (result2) {
        return {
            success: true,
        };
    }
});
