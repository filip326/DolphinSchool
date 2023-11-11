import { ObjectId, WithId } from "mongodb";
import MethodResult, { DolphinErrorTypes } from "../MethodResult";
import Dolphin from "../Dolphin";
import webpush from "web-push";
import Setting from "../Settings";

// if (!process.env.GCM_API_KEY) {
//     throw new Error("GCM_API_KEY not set");
// }
// webpush.setGCMAPIKey(process.env.GCM_API_KEY);

let vapidKeys = await Setting.get<webpush.VapidKeys>("vapidKeys");
if (!vapidKeys) {
    vapidKeys = webpush.generateVAPIDKeys();
    await Setting.set("vapidKeys", vapidKeys);
}

webpush.setVapidDetails(
    useRuntimeConfig().public.DOMAIN,
    vapidKeys.publicKey,
    vapidKeys.privateKey,
);

type PushNotificationData = {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
};

interface IPrivatePushNotificationDevice {
    owner: ObjectId; // the user that owns this device
    pushData: PushNotificationData; // the data needed to send a push notification to this device

    expireryWarningSent?: number; // the last time a warning was sent to the user that the device will be removed soon

    deviceName: string; // the name of the device
}

class PushNotificationDevice implements WithId<IPrivatePushNotificationDevice> {
    static async registerDevice(
        owner: ObjectId,
        pushData: PushNotificationData,
        deviceName: string,
    ): Promise<MethodResult<PushNotificationDevice>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const db = await dolphin.database;
        const devices = db.collection<IPrivatePushNotificationDevice>(
            "push_notification_devices",
        );

        // check if the user has already registered a device, if so, delete it
        await devices.deleteMany({ owner: owner });

        const data: IPrivatePushNotificationDevice = {
            owner: owner,
            pushData: pushData,
            deviceName: deviceName,
        };

        // now insert the new device
        const result = await devices.insertOne(data);

        return [
            new PushNotificationDevice({
                ...data,
                _id: result.insertedId,
            }),
            null,
        ];
    }
    static async reregister(
        owner: ObjectId,
        pushData: PushNotificationData,
    ): Promise<MethodResult<boolean>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const db = await dolphin.database;
        const devices = db.collection<IPrivatePushNotificationDevice>(
            "push_notification_devices",
        );

        const result = await devices.findOneAndUpdate(
            { owner: owner },
            { $set: { pushData: pushData } },
        );

        if (result.ok) return [true, null];
        else return [undefined, DolphinErrorTypes.DATABASE_ERROR];
    }

    static async getDevice(
        owner: ObjectId,
    ): Promise<MethodResult<PushNotificationDevice>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const db = await dolphin.database;
        const devices = db.collection<IPrivatePushNotificationDevice>(
            "push_notification_devices",
        );

        const result = await devices.findOne({ owner: owner });

        if (result) return [new PushNotificationDevice(result), null];
        else return [undefined, DolphinErrorTypes.NOT_FOUND];
    }

    // this represents a device that can receive push notifications
    _id: ObjectId;
    owner: ObjectId;
    pushData: PushNotificationData;
    expireryWarningSent?: number | undefined;
    deviceName: string;
    private constructor(options: WithId<IPrivatePushNotificationDevice>) {
        this._id = options._id;
        this.owner = options.owner;
        this.pushData = options.pushData;
        this.expireryWarningSent = options.expireryWarningSent;
        this.deviceName = options.deviceName;
    }

    async sendPush(content: string): Promise<MethodResult<boolean>> {
        try {
            await webpush.sendNotification(this.pushData, content, {
                TTL: 30, // 30 seconds
            });
            return [true, null];
        } catch (e) {
            return [undefined, DolphinErrorTypes.FAILED];
        }
    }

    async unregister(): Promise<MethodResult<boolean>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const db = await dolphin.database;
        const devices = db.collection<IPrivatePushNotificationDevice>(
            "push_notification_devices",
        );
        const result = await devices.deleteOne({ _id: this._id });
        if (result.acknowledged) return [true, null];
        else return [undefined, DolphinErrorTypes.DATABASE_ERROR];
    }

    get expires(): Date {
        // the time the device was registered + 60 days
        return new Date(this._id.getTimestamp().getTime() + 60 * 24 * 60 * 60 * 1000);
    }
}

export default PushNotificationDevice;
