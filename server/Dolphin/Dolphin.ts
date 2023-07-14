import { MongoClient, Db } from "mongodb";
import GlobalUserManager from "./User/GlobalUserManager";
import SessionManager from "./Session/SessionManager";
import GlobalCourseManager from "./Course/GlobalCourseManager";

class Dolphin {
    ready: boolean = false;
    database?: Db;
    users?: GlobalUserManager;
    sessions?: SessionManager;
    courses?: GlobalCourseManager;

    private static connectionPromise: Promise<Db> | null = null;

    constructor(mongoDbUrl: string, dbName: string, callback: (dolphin: Dolphin, success: boolean, error?: Error) => void) {
        if (Dolphin.connectionPromise === null) {
            Dolphin.connectionPromise = MongoClient.connect(mongoDbUrl).then((client) => {
                console.log("Connected successfully to DB");
                return client.db(dbName);
            });
        }

        Dolphin.connectionPromise
            .then((db) => {
                this.database = db;
                this.users = new GlobalUserManager(this.database);
                this.sessions = new SessionManager(this.database);
                this.courses = new GlobalCourseManager(this.database);
                this.ready = true;
                callback(this, true);
            })
            .catch((error) => {
                callback(this, false, error);
            });
    }
}

export default Dolphin;
