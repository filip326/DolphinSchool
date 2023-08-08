import { MongoClient, Db } from "mongodb";
import SessionManager from "./Session/SessionManager";
import GlobalCourseManager from "./Course/GlobalCourseManager";
import UserMessageManager from "./Messenger/UserMessageManager";
import User from "./User/User";
import MethodResult from "./MethodResult";
import { IMessage } from "./Messenger/Message";
import { IUserMessage } from "./Messenger/UserMessage";

const runtimeConfig = useRuntimeConfig();

class Dolphin {
    ready: boolean = false;
    database: Db;
    /** @depracted */
    sessions: SessionManager;
    /** @deprecated */
    courses: GlobalCourseManager;

    private static _instance?: Dolphin;

    static get instance(): Dolphin | undefined {
        return Dolphin._instance;
    }

    private constructor(db: Db, cb: (dolphin: Dolphin) => void) {
        if (Dolphin._instance)
            throw new Error("Dolphin instance already exists! Class Dolphin is a singleton!");

        this.database = db;
        this.sessions = SessionManager.getInstance(this);
        this.courses = GlobalCourseManager.getInstance(this);

        this.ready = true;

        Dolphin._instance = this;

        cb(this);
    }

    static init(dbName?: string): Promise<Dolphin> {
        return new Promise(async (resolve: (value: Dolphin) => void, reject) => {
            if (Dolphin.instance) return resolve(Dolphin.instance);

            const db = (await MongoClient.connect(runtimeConfig.DB_URL).catch(reject))?.db(
                dbName ?? runtimeConfig.DB_NAME + (runtimeConfig.prod ? "" : "--DEV")
            );

            if (!db) return;

            new Dolphin(db, resolve);
        });
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
