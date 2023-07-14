import { MongoClient, Db } from "mongodb";
import GlobalUserManager from "./User/GlobalUserManager";
import SessionManager from "./Session/SessionManager";
import GlobalCourseManager from "./Course/GlobalCourseManager";

class Dolphin {

    ready: boolean;
    database?: Db;
    users?: GlobalUserManager;
    sessions?: SessionManager;
    courses?: GlobalCourseManager;

    constructor (mongoDbUrl: string, dbName: string, callback: (dolphin: Dolphin, success: boolean, error?: Error) => void) {
        this.ready = false;
        MongoClient.connect(mongoDbUrl).then((client) => {
            this.database = client.db(dbName);
            this.users = new GlobalUserManager(this.database);
            this.sessions = new SessionManager(this.database);
            this.courses = new GlobalCourseManager(this.database);
            this.ready = true;
            callback(this, true);
        }).catch((error) => {
            callback(this, false, error);
        });
    }

}

export default Dolphin;
