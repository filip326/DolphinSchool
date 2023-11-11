import Dolphin from "../Dolphin";

interface ISetting {
    name: string;
    value: any;
}

class Setting {
    static async set<T>(name: string, value: T) {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const setting = await dolphin.database.collection<ISetting>("settings");

        if ((await setting.countDocuments({ name })) === 0) {
            await setting.insertOne({ name, value });
        } else {
            await setting.updateOne({ name }, { $set: { value } });
        }
    }

    static async get<T>(name: string): Promise<T | undefined> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const setting = await dolphin.database.collection<ISetting>("settings");

        const settingData = await setting.findOne({ name });
        if (!settingData) return undefined;
        return settingData.value satisfies T;
    }
}

export default Setting;
