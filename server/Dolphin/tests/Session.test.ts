import Dolphin from "../Dolphin";
import { config } from "dotenv";
import Session, { ISession, SessionState } from "../Session/Session";
import User, { IUser } from "../User/User";
import { manyDummyUsers } from "./initTests";
import { ObjectId } from "mongodb";
import { DolphinErrorTypes } from "../MethodResult";

config();

describe("Session class", () => {
    beforeEach(async () => {
        if (!process.env.DB_URL) throw Error("DB_URL not set in .env file");


        await Dolphin.init({
            prod: false,
            DB_URL: process.env.DB_URL,
            DB_NAME: "dolphinSchool--test-Session_class"
        });

        const db = Dolphin.instance!.database;

        // drop database before creating dummy users
        await db.dropDatabase();
        await db.collection<IUser>("users").insertMany(
            await manyDummyUsers(5)
        );

        // insert a session for one user
        await db.collection<ISession>("sessions").insertOne({
            token: "testToken",
            userId: ObjectId.createFromTime(0),
            expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
            lastUsed: Date.now(),
            state: SessionState.INACTIVE,
            type: "Session"
        });
    });

    it("should create a session", async () => {

        const [user, userGetError ] = await User.getUserByUsername("testUser0");

        if (userGetError || !user) throw Error(userGetError);

        const [session, sessionCreateError] = await Session.createSession(
            user
        );

        expect(sessionCreateError).toBeNull();
        expect(session).toBeDefined();
        expect(session).toHaveProperty("userId", user._id);
    });

    it("should get a session", async () => {
        const [sessionFound, sessionFoundError] = await Session.findSession("testToken");
        expect(sessionFoundError).toBeNull();
        expect(sessionFound).toBeDefined();
        expect(sessionFound).toHaveProperty("userId");
        expect(sessionFound?.userId).toBeInstanceOf(ObjectId);
    });

    it("should delete a session", async () => {
        
        const [session, sessionFoundError] = await Session.findSession("testToken");

        if (sessionFoundError || !session) throw Error(sessionFoundError);

        const [destroyed, destroyedError] = await session.destroy();
        expect(destroyedError).toBeNull();
        expect(destroyed).toBeTruthy();

        const [sessionFound, sessionFoundError2] = await Session.findSession(session!.token);
        expect(sessionFoundError2).not.toBeNull();
        expect(sessionFoundError2).toBe(DolphinErrorTypes.NOT_FOUND);
        expect(sessionFound).toBeUndefined();
    });

    it("should activate a session", async () => {

        const [ session, sessionFoundError ] = await Session.findSession("testToken");

        if (sessionFoundError || !session) throw Error(sessionFoundError);

        expect(session).toHaveProperty("state", SessionState.INACTIVE);

        const [activated, activatedError] = await session.activate();

        expect(activatedError).toBeNull();
        expect(activated).toBeTruthy();

        const [sessionFound, sessionFoundError2] = await Session.findSession(session.token);
        expect(sessionFoundError2).toBeNull();
        expect(sessionFound).toHaveProperty("state", SessionState.ACTIVE);
    });

    it("should report usage to a session", async () => {

        const [ session, sessionFoundError ] = await Session.findSession("testToken");

        if (sessionFoundError || !session) throw Error(sessionFoundError);

        expect(session).toHaveProperty("lastUsed");
        expect(session.lastUsed).toBeGreaterThanOrEqual(Date.now() - 5);
        expect(session.lastUsed).toBeLessThanOrEqual(Date.now());
        
        setTimeout(async () => {

            expect(session.lastUsed).not.toBeGreaterThanOrEqual(Date.now() - 100); // 100 ms tolerance
            await session.reportUsage();
            expect(session.lastUsed).toBeGreaterThanOrEqual(Date.now() - 100); // 100 ms tolerance 

        }, 100);

    });

    it("should refresh a session", async () => {

        const [ session, sessionFoundError ] = await Session.findSession("testToken");

        if (sessionFoundError || !session) throw Error(sessionFoundError);

        expect(session.expires).toBeLessThanOrEqual(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

        const [refreshed, refreshedError] = await session.refresh();

        expect(refreshedError).toBeNull();
        expect(refreshed).toBeTruthy();

        expect(session.expires).toBeGreaterThanOrEqual(Date.now() + 1000 * 60 * 60 * 24 * 7 - 1000 * 10); // 7 days with 10s tolerance

    });

    afterAll(async () => {
        await Dolphin.instance!.database.dropDatabase();
        Dolphin.destroy();
    });
});
