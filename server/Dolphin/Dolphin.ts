import { MongoClient, Db } from "mongodb";
import GlobalAnalyticsManager from "./Analytics/GlobalAnalyticsManager";

class Dolphin {
    ready: boolean = false;
    private readonly client: MongoClient;
    readonly database: Db;

    private static _instance?: Dolphin;

    static get instance(): Dolphin | undefined {
        return Dolphin._instance;
    }

    private constructor(db: Db, client: MongoClient, cb: (dolphin: Dolphin) => void) {
        if (Dolphin._instance)
            throw new Error("Dolphin instance already exists! Class Dolphin is a singleton!");

        this.database = db;
        this.client = client;

        this.ready = true;

        Dolphin._instance = this;

        cb(this);
    }

    static init(config: { prod: boolean; DB_URL: string; DB_NAME: string }): Promise<Dolphin> {
        return new Promise(async (resolve: (value: Dolphin) => void, reject) => {
            if (Dolphin.instance) return resolve(Dolphin.instance);

            try {
                const client = await MongoClient.connect(config.DB_URL);
                const db = client.db(
                    config.DB_NAME +
                        (config.prod || config.DB_NAME.endsWith("--test") ? "" : "--DEV")
                );

                if (!db) return;

                new Dolphin(db, client, resolve);

                // add the dayly analytics every day at 00:00
                setInterval(() => {
                    const now = new Date();
                    if (now.getHours() === 13 && now.getMinutes() === 40) {
                        GlobalAnalyticsManager.addDaylyAnalytics();
                    }
                }, 1000 * 60); // ! change
            } catch (err) {
                reject(err);
                return;
            }
        });
    }

    static destroy() {
        Dolphin.instance?.client?.close();
        Dolphin._instance = undefined;
    }
}

export default Dolphin;
