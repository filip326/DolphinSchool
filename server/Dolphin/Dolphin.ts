import { MongoClient, Db } from "mongodb";

class Dolphin {
    ready: boolean = false;
    private readonly client: MongoClient;
    readonly database: Db;

    private static _instance?: Dolphin;

    static get instance(): Dolphin | undefined {
        return Dolphin._instance;
    }

    private constructor(db: Db, client: MongoClient, cb: (dolphin: Dolphin) => void) {
        if (Dolphin.instance && Dolphin.instance.ready) {
            console.log("Dolphin instance already exists! Class Dolphin is a singleton!");
        }

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
                        (config.prod || config.DB_NAME.endsWith("--test") ? "" : "--DEV"),
                );

                if (!db) return;

                new Dolphin(db, client, resolve);
            } catch (err) {
                reject(err);
                return;
            }
        });
    }

    static async getBlockedPwds(): Promise<string[]> {
        const dolphin = Dolphin.instance
            ? Dolphin.instance
            : await Dolphin.init(useRuntimeConfig());
        const pwdCollection = dolphin.database.collection<{ pwd: string }>("passwordBlockList");
        return (await pwdCollection.find({}).toArray()).map((pwd) => pwd.pwd);
    }

    static async addBlockedPwd(pwd: string): Promise<boolean> {
        const dolphin = Dolphin.instance
            ? Dolphin.instance
            : await Dolphin.init(useRuntimeConfig());
        const pwdCollection = dolphin.database.collection<{ pwd: string }>("passwordBlockList");
        return (await pwdCollection.insertOne({ pwd })).acknowledged;
    }

    static async removeBlockedPwd(pwd: string): Promise<boolean> {
        const dolphin = Dolphin.instance
            ? Dolphin.instance
            : await Dolphin.init(useRuntimeConfig());
        const pwdCollection = dolphin.database.collection<{ pwd: string }>("passwordBlockList");
        return (await pwdCollection.deleteMany({ pwd })).acknowledged;
    }

    static destroy() {
        Dolphin.instance?.client?.close();
        Dolphin._instance = undefined;
    }
}

export default Dolphin;
