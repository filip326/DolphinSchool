import { MongoClient, Db } from "mongodb";
import GlobalUserManager from "./User/GlobalUserManager";
import SessionManager from "./Session/SessionManager";
import GlobalCourseManager from "./Course/GlobalCourseManager";

const runtimeConfig = useRuntimeConfig();

class Dolphin {
  ready: boolean = false;
  database: Db;
  users: GlobalUserManager;
  sessions: SessionManager;
  courses: GlobalCourseManager;

  private static _instance?: Dolphin;

  static get instance(): Dolphin | undefined {
    return Dolphin._instance;
  };

  private constructor(db: Db, cb: (dolphin: Dolphin) => void) {

    if (Dolphin._instance) throw new Error("Dolphin instance already exists! Class Dolphin is a singleton!");

    this.database = db;

    this.users = new GlobalUserManager(this.database);
    this.sessions = new SessionManager(this.database);
    this.courses = new GlobalCourseManager(this.database);

    this.ready = true;

    Dolphin._instance = this;

    cb(this);

  }

  static init(): Promise<Dolphin> {
    return new Promise(async (resolve: (value: Dolphin) => void, reject) => {

      if (Dolphin.instance) return resolve(Dolphin.instance);

      const db = (await MongoClient.connect(runtimeConfig.DB_URL).catch(reject))?.db(runtimeConfig.DB_NAME);
      
      if (!db) return;

      new Dolphin(db, resolve);

    });
  }

}

export default Dolphin;
