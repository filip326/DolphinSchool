import { MongoClient, Db } from "mongodb";
import SessionManager from "./Session/SessionManager";
import GlobalCourseManager from "./Course/GlobalCourseManager";
import UserMessageManager from "./Messenger/UserMessageManager";
import User from "./User/User";
import MethodResult from "./MethodResult";
import { IMessage } from "./Messenger/Message";
import { IUserMessage } from "./Messenger/UserMessage";

class Dolphin {
    ready: boolean = false;
    private readonly client: MongoClient;
    readonly database: Db;
    /** @deprecated */
    sessions: SessionManager;
    /** @deprecated */
    courses: GlobalCourseManager;

    private static _instance?: Dolphin;

    static get instance(): Dolphin | undefined {
        return Dolphin._instance;
    }

    private constructor(db: Db, client: MongoClient, cb: (dolphin: Dolphin) => void) {
        if (Dolphin._instance)
            throw new Error("Dolphin instance already exists! Class Dolphin is a singleton!");

        this.database = db;
        this.client = client;
        this.sessions = SessionManager.getInstance(this);
        this.courses = GlobalCourseManager.getInstance(this);

        this.ready = true;

        Dolphin._instance = this;

        cb(this);
    }

    static init(config: {
        prod: boolean;
        DB_URL: string;
        DB_NAME: string;
    }): Promise<Dolphin> {
        return new Promise(async (resolve: (value: Dolphin) => void, reject) => {
            if (Dolphin.instance) return resolve(Dolphin.instance);

            try {
                const client = await MongoClient.connect(config.DB_URL);
                const db = client.db(
                    config.DB_NAME + (config.prod || config.DB_NAME.endsWith("--test") ? "" : "--DEV")
                );

                if (!db) return;

                new Dolphin(db, client, resolve);
            } catch (err) { reject(err); return; }
        });
    }

    static destroy() {
        Dolphin.instance?.client?.close();
        Dolphin._instance = undefined;
    }

    async getMessenger(user: User): Promise<MethodResult<UserMessageManager>> {
        const userMessageManager = new UserMessageManager(
            this.database.collection<IMessage>("messages"),
            this.database.collection<IUserMessage>("userMessages"),
            {
                userId: user._id
            }
        );

        return [userMessageManager, null];
    }
}

export default Dolphin;
