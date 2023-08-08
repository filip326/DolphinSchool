import Dolphin from "../Dolphin";
import { config } from "dotenv";
import Session from "../Session/Session";
import User from "../User/User";

config();

describe("Session class", () => {
    beforeAll(async () => {
        if (!process.env.DB_URL) throw Error("DB_URL not set in .env file");

        await Dolphin.init({
            prod: false,
            DB_URL: process.env.DB_URL,
            DB_NAME: "dolphinSchool--test"
        });

        const db = Dolphin.instance!.database;

        // drop database before creating dummy users
        await db.dropDatabase();
    });

    it("should create a session", async () => {
        const [usr, userCreateError] = await User.createUser({
            username: "testUser",
            fullName: "Test User",
            type: "student",
            password: "testPassword"
        });
        if (userCreateError || !usr) throw userCreateError;
        const [user, userByidError] = await User.getUserById(usr.id);
        if (userByidError || !user) throw userByidError;

        const [session, sessionCreateError] = await Session.createSession(user);

        expect(sessionCreateError).toBeNull();
        expect(session).toBeDefined();
        expect(session).toHaveProperty("userId", user._id);
    });

    it("should get a session", async () => {
        const [usr, userCreateError] = await User.createUser({
            username: "testUser",
            fullName: "Test User",
            type: "student",
            password: "testPassword"
        });
        if (userCreateError || !usr) throw userCreateError;
        const [user, userByidError] = await User.getUserById(usr.id);
        if (userByidError || !user) throw userByidError;
        const [session, sessionCreateError] = await Session.createSession(user);
        if (sessionCreateError || !session) throw sessionCreateError;

        const [sessionFound, sessionFoundError] = await Session.findSession(session!.token);
        expect(sessionFoundError).toBeNull();
        expect(sessionFound).toBeDefined();
        expect(sessionFound).toHaveProperty("userId", user._id);
    });

    afterAll(async () => {
        await Dolphin.instance!.database.dropDatabase();
        Dolphin.destroy();
    });
});
