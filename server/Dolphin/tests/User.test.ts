import Dolphin from "../Dolphin";
import { config } from "dotenv";
import User, { IUser } from "../User/User";
import { ObjectId } from "mongodb";
import { manyDummyUsers } from "./initTests";
import { URI } from "otpauth";
import { DolphinErrorTypes } from "../MethodResult";

config();

describe("User class", () => {
    beforeAll(async () => {
        if (!process.env.DB_URL) throw Error("DB_URL not set in .env file");

        await Dolphin.init({
            prod: false,
            DB_URL: process.env.DB_URL,
            DB_NAME: "dolphinSchool--test-User_class",
        });

        const db = Dolphin.instance!.database;

        // drop database before creating dummy users
        await db.dropDatabase();

        await db.collection<IUser>("users").insertMany(await manyDummyUsers(30));
    });

    it("should create a user", async () => {
        const [user, userCreateError] = await User.createUser({
            username: "testUser",
            fullName: "Test User",
            type: "student",
            password: "testPassword",
        });

        expect(userCreateError).toBeNull();
        expect(user).toBeDefined();
        expect(user).toHaveProperty("username", "testUser");
        expect(user).toHaveProperty("password");
    });

    it("should not create a user with the same username", async () => {
        const [user, userCreateError] = await User.createUser({
            username: "testUser0",
            fullName: "Test User 0",
            type: "student",
            password: "testPassword",
        });

        expect(userCreateError).toBeDefined();
        expect(userCreateError).toBe(DolphinErrorTypes.ALREADY_EXISTS);
        expect(user).toBeUndefined();
    });

    it("should not create a user with an invalid type", async () => {
        const [user, userCreateError] = await User.createUser({
            username: "notExistingTextUser",
            fullName: "Test User",
            // ts-ignore because we want to test for invalid type
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            type: "invalidType",
            password: "testPassword",
        });

        expect(userCreateError).toBeDefined();
        expect(userCreateError).toBe(DolphinErrorTypes.INVALID_TYPE);
        expect(user).toBeUndefined();
    });

    it("should find a user by username", async () => {
        const [user, userFindError] = await User.getUserByUsername("testUser0");

        expect(userFindError).toBeNull();
        expect(user).toBeDefined();
        expect(user).toHaveProperty("username", "testUser0");
        expect(user).toBeInstanceOf(User);
    });

    it("should not find a non-existent user by username", async () => {
        const [user, userFindError] = await User.getUserByUsername("nonExistentUser");

        expect(userFindError).toBeDefined();
        expect(userFindError).toBe(DolphinErrorTypes.NOT_FOUND);
        expect(user).toBeUndefined();
    });

    it("should find a user by id", async () => {
        const dbResult = await Dolphin.instance!.database.collection("users").findOne({
            username: "testUser0",
        });
        if (!dbResult) throw new Error("User not found in database");

        const [user, userFindError] = await User.getUserById(dbResult._id);

        expect(userFindError).toBeNull();
        expect(user).toBeDefined();
        expect(user).toHaveProperty("username", "testUser0");
        expect(user).toBeInstanceOf(User);
    });

    it("should not find a non-existent user by id", async () => {
        const [user, userFindError] = await User.getUserById(ObjectId.createFromTime(0));

        expect(userFindError).toBeDefined();
        expect(userFindError).toBe(DolphinErrorTypes.NOT_FOUND);
        expect(user).toBeUndefined();
    });

    it("should list all users", async () => {
        const [userList, userListError] = await User.listUsers({ limit: 30 });

        expect(userListError).toBeNull();
        expect(userList).toBeDefined();
        expect(userList).toHaveLength(30);
        for (const user of userList ?? []) {
            expect(user).toBeInstanceOf(User);
        }
    }, 30_000);

    it("should list 15 users", async () => {
        const [userList, userListError] = await User.listUsers({ limit: 15 });

        expect(userListError).toBeNull();
        expect(userList).toBeDefined();
        expect(userList).toHaveLength(15);
        for (const user of userList ?? []) {
            expect(user).toBeInstanceOf(User);
        }
    });

    it("should list 15 users starting from the 10th user", async () => {
        const [userList, userListError] = await User.listUsers({ limit: 15, skip: 10 });

        expect(userListError).toBeNull();
        expect(userList).toBeDefined();
        expect(userList).toHaveLength(15);
        expect(userList?.at(0)?.username).toBe("testUser10");
        for (const user of userList ?? []) {
            expect(user).toBeInstanceOf(User);
        }
    });

    it("should change a user's password", async () => {
        const [user, userFindError] = await User.getUserByUsername("testUser0");

        expect(userFindError).toBeNull();
        expect(user).toBeDefined();

        const [passwordChangeResult, passwordChangeError] = await user!.setPassword("jzJu3f7.jzJu3f7.");

        expect(passwordChangeError).toBeNull();
        expect(passwordChangeResult).toBeDefined();
        expect(passwordChangeResult).toBe(true);
    });

    it("should not change a user's password if the password is to short", async () => {
        const [user, userFindError] = await User.getUserByUsername("testUser0");

        expect(userFindError).toBeNull();
        expect(user).toBeDefined();

        const [passwordChangeResult, passwordChangeError] = await user!.setPassword("short");

        expect(passwordChangeError).toBeDefined();
        expect(passwordChangeError).toBe(DolphinErrorTypes.INVALID_ARGUMENT);
        expect(passwordChangeResult).toBeUndefined();
    });

    it("should not change a user's password if the password does not contain letters, numbers and capitals", async () => {
        const [user, userFindError] = await User.getUserByUsername("testUser0");

        expect(userFindError).toBeNull();
        expect(user).toBeDefined();

        const [passwordChangeResult, passwordChangeError] = await user!.setPassword("aaaaaaaaaaaaa");

        expect(passwordChangeError).toBeDefined();
        expect(passwordChangeError).toBe(DolphinErrorTypes.INVALID_ARGUMENT);
        expect(passwordChangeResult).toBeUndefined();
    });

    it("should compare the password and return true if correct", async () => {
        const [user, userFindError] = await User.getUserByUsername("testUser9");

        expect(userFindError).toBeNull();
        expect(user).toBeDefined();

        const [passwordValidationResult, passwordValidationError] = await user!.comparePassword("testPassword");

        expect(passwordValidationError).toBeNull();
        expect(passwordValidationResult).toBeDefined();
        expect(passwordValidationResult).toBe(true);
    });

    it("should compare the password and return false if incorrect", async () => {
        const [user, userFindError] = await User.getUserByUsername("testUser0");

        expect(userFindError).toBeNull();
        expect(user).toBeDefined();

        const [passwordValidationResult, passwordValidationError] = await user!.comparePassword("incorrectPassword");

        expect(passwordValidationError).toBeNull();
        expect(passwordValidationResult).toBeDefined();
        expect(passwordValidationResult).toBe(false);
    });

    it("should enable mfa for a user", async () => {
        const [user, userFindError] = await User.getUserByUsername("testUser0");

        expect(userFindError).toBeNull();
        expect(user).toBeDefined();

        const [mfaEnableResult, mfaEnableError] = await user!.setUpMFA();

        expect(mfaEnableError).toBeNull();
        expect(mfaEnableResult).toBeDefined();
        expect(mfaEnableResult).toBeTruthy();
        expect(typeof mfaEnableResult).toBe("string");

        expect(user?.mfaEnabled).toBe(false); // mfa is still in setup mode, not enabled yet

        // generate a totp code based on provided secret uri
        const totpUriParsed = URI.parse(mfaEnableResult!);
        const totp = totpUriParsed.generate();

        const [mfaEnableResult2, mfaEnableError2] = await user!.completeMFASetup(totp);

        expect(mfaEnableError2).toBeNull();
        expect(mfaEnableResult2).toBeDefined();
        expect(user?.mfaEnabled).toBe(true); // mfa is now enabled, since setup was completed by providing a valid totp code
    });

    afterAll(async () => {
        await Dolphin.instance!.database.dropDatabase();
        Dolphin.destroy();
    });
});
