import Dolphin from "../Dolphin";

interface SupportItem {
    inputs: {
        username: string;
        krz: string;
        gebDate: string;
    };
    failed: boolean;
    date: number;
    solved?: boolean;
}

class SupportManager {
    public static async createFailedSupport(
        username: string,
        krz: string,
        gebDate: string,
    ): Promise<SupportItem> {
        const dolphin = Dolphin.instance
            ? Dolphin.instance
            : await Dolphin.init(useRuntimeConfig());
        const db = dolphin.database.collection<SupportItem>("support");
        const supportItem: SupportItem = {
            inputs: {
                username,
                krz,
                gebDate,
            },
            failed: true,
            date: Date.now(),
        };
        db.insertOne(supportItem);
        return supportItem;
    }

    public static async createSupport(
        username: string,
        krz: string,
        gebDate: string,
    ): Promise<SupportItem> {
        const dolphin = Dolphin.instance
            ? Dolphin.instance
            : await Dolphin.init(useRuntimeConfig());
        const db = dolphin.database.collection<SupportItem>("support");
        const supportItem: SupportItem = {
            inputs: {
                username,
                krz,
                gebDate,
            },
            failed: false,
            date: Date.now(),
        };
        db.insertOne(supportItem);
        return supportItem;
    }

    public static async getAllFailedSupports(username: string): Promise<SupportItem[]> {
        const dolphin = Dolphin.instance
            ? Dolphin.instance
            : await Dolphin.init(useRuntimeConfig());
        const db = dolphin.database.collection<SupportItem>("support");
        return db.find({ "inputs.username": username, failed: true }).toArray();
    }

    /**
     * @param username the username to check
     * @returns true if the user should be blocked
     */
    public static async supportBruthforceProtection(username: string): Promise<boolean> {
        // checks if in the last hour more then 3 failed supports were created
        // checks if in the last day more then 5 failed supports were created
        // checks if in the last week more then 10 failed supports were created

        const dolphin = Dolphin.instance
            ? Dolphin.instance
            : await Dolphin.init(useRuntimeConfig());
        const db = dolphin.database.collection<SupportItem>("support");
        const failedSupports = await db
            .find({ "inputs.username": username, failed: true })
            .toArray();
        const failedSupportsLastHour = failedSupports.filter(
            (support) => support.date > Date.now() - 3600000,
        );
        const failedSupportsLastDay = failedSupports.filter(
            (support) => support.date > Date.now() - 86400000,
        );
        const failedSupportsLastWeek = failedSupports.filter(
            (support) => support.date > Date.now() - 604800000,
        );
        if (
            failedSupportsLastHour.length > 3 ||
            failedSupportsLastDay.length > 5 ||
            failedSupportsLastWeek.length > 10
        ) {
            return true;
        }
        return false;
    }
}

export default SupportManager;
export { SupportItem };
