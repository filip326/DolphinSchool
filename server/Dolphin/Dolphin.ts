import { MongoClient, Db } from "mongodb";
import GlobalUserManager from "./User/GlobalUserManager";
import SessionManager from "./Session/SessionManager";
import GlobalCourseManager from "./Course/GlobalCourseManager";

class Dolphin {
  private static instance: Dolphin;
  private readonly mongoDbUrl: string;
  private readonly dbName: string;
  private ready: boolean;
  private database?: Db;
  private users?: GlobalUserManager;
  private sessions?: SessionManager;
  private courses?: GlobalCourseManager;

  private constructor(mongoDbUrl: string, dbName: string) {
    this.mongoDbUrl = mongoDbUrl;
    this.dbName = dbName;
    this.ready = false;
  }

  public static async getInstance(mongoDbUrl: string, dbName: string): Promise<Dolphin> {
    if (!Dolphin.instance) {
      Dolphin.instance = await new Dolphin(mongoDbUrl, dbName).init();
    }
    return Dolphin.instance;
  }

  public async init(): Promise<Dolphin> {
    this.ready = false;
    const client = await MongoClient.connect(this.mongoDbUrl)
    this.database = client.db(this.dbName);
    this.users = new GlobalUserManager(this.database);
    this.sessions = new SessionManager(this.database);
    this.courses = new GlobalCourseManager(this.database);
    this.ready = true;
    return this;
  }


  public isReady(): boolean {
    return this.ready;
  }

  public getDatabase(): Db | undefined {
    return this.database;
  }

  public getUsers(): GlobalUserManager | undefined {
    return this.users;
  }

  public getSessions(): SessionManager | undefined {
    return this.sessions;
  }

  public getCourses(): GlobalCourseManager | undefined {
    return this.courses;
  }
}

export default Dolphin;

// export a instance of Dolphin
export const dolphin = await Dolphin.getInstance("mongodb://localhost:27017", "dolphin");
