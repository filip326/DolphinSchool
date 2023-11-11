import PushNotificationDevice from "~/server/Dolphin/PushNotificationDevice";

type PushNotificationSearchDeviceResult =
    | {
          deviceFound: true;
          deviceName: string;
          expires: number;
      }
    | { deviceFound: false };

export default defineEventHandler(
    async (event): Promise<PushNotificationSearchDeviceResult> => {
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

        return {
            deviceFound: true,
            deviceName: result.deviceName,
            expires: result.expires.getTime(),
        };
    },
);
