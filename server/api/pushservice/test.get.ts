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

    const [device, err] = await PushNotificationDevice.getDevice(user._id);
    if (err) {
        throw createError({
            statusMessage: "Internal server error",
            statusCode: 500,
            fatal: true,
        });
    }

    device.sendPush({
        title: "Test",
        body: `Das ist ein Test um zu sehen ob Push Notifications funktionieren. Gerätename: ${device.deviceName}`,
    });
});
