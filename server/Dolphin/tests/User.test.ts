import Dolphin from "../Dolphin";
import { config } from "dotenv";
import User from "../User/User";
import { ObjectId } from "mongodb";

config();

describe("User class", () => {
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

    it("should create a user", async () => {
        const [user, userCreateError] = await User.createUser({
            username: "testUser",
            fullName: "Test User",
            type: "student",
            password: "testPassword"
        });

        expect(userCreateError).toBeNull();
        expect(user).toBeDefined();
        expect(user).toHaveProperty("username", "testUser");
        expect(user).toHaveProperty("password");
    });

    it("should not create a user with the same username", async () => {
        const [user, userCreateError] = await User.createUser({
            username: "testUser",
            fullName: "Test User",
            type: "student",
            password: "testPassword"
        });

        expect(userCreateError).toBeDefined();
        expect(userCreateError).toHaveProperty("message", "User with same username already exists");
        expect(user).toBeUndefined();
    });

    it("should not create a user with an invalid type", async () => {
        const [user, userCreateError] = await User.createUser({
            username: "testUser2",
            fullName: "Test User",
            // ts-ignore because we want to test for invalid type
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            type: "invalidType",
            password: "testPassword"
        });

        expect(userCreateError).toBeDefined();
        expect(userCreateError).toHaveProperty("message", "Invalid user type");
        expect(user).toBeUndefined();
    });

    it("should find a user by username", async () => {
        const [user, userFindError] = await User.getUserByUsername("testUser");

        expect(userFindError).toBeNull();
        expect(user).toBeDefined();
        expect(user).toHaveProperty("username", "testUser");
        expect(user).toBeInstanceOf(User);
    });

    it("should not find a non-existent user by username", async () => {
        const [user, userFindError] = await User.getUserByUsername("nonExistentUser");

        expect(userFindError).toBeDefined();
        expect(userFindError).toHaveProperty("message", "User not found");
        expect(user).toBeUndefined();
    });

    it("should find a user by id", async () => {
        const dbResult = await Dolphin.instance!.database.collection("users").findOne({
            username: "testUser"
        });
        if (!dbResult) throw new Error("User not found in database");

        const [user, userFindError] = await User.getUserById(dbResult._id);

        expect(userFindError).toBeNull();
        expect(user).toBeDefined();
        expect(user).toHaveProperty("username", "testUser");
        expect(user).toBeInstanceOf(User);
    });

    it("should not find a non-existent user by id", async () => {
        const [user, userFindError] = await User.getUserById(ObjectId.createFromTime(0));

        expect(userFindError).toBeDefined();
        expect(userFindError).toHaveProperty("message", "User not found");
        expect(user).toBeUndefined();
    });

    it("should list all users", async () => {
        // create 30 more dummy users
        for (let i = 5; i < 35; i++) {
            const [user, createError] = await User.createUser({
                username: `testUser${i}`,
                fullName: `Test User ${i}`,
                type: i % 3 === 0 ? "student" : i % 3 === 1 ? "teacher" : "parent",
                password: "testPassword"
            });
            expect(createError).toBeNull();
            expect(user).toBeDefined();
        }

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
        for (const user of userList ?? []) {
            expect(user).toBeInstanceOf(User);
        }
    });

    it("should change a user's password", async () => {
        const [user, userFindError] = await User.getUserByUsername("testUser");

        expect(userFindError).toBeNull();
        expect(user).toBeDefined();

        const [passwordChangeResult, passwordChangeError] = await user!.setPassword(
            "jzJu3f7.jzJu3f7."
        );

        expect(passwordChangeError).toBeNull();
        expect(passwordChangeResult).toBeDefined();
        expect(passwordChangeResult).toBe(true);
    });

    it("should not change a user's password if the password is to short", async () => {
        const [user, userFindError] = await User.getUserByUsername("testUser");

        expect(userFindError).toBeNull();
        expect(user).toBeDefined();

        const [passwordChangeResult, passwordChangeError] = await user!.setPassword("short");

        expect(passwordChangeError).toBeDefined();
        expect(passwordChangeError).toHaveProperty(
            "message",
            "Password must be at least 8 characters long"
        );
        expect(passwordChangeResult).toBeUndefined();
    });

    it("should not change a user's password if the password does not contain letters, numbers and capitals", async () => {
        const [user, userFindError] = await User.getUserByUsername("testUser");

        expect(userFindError).toBeNull();
        expect(user).toBeDefined();

        const [passwordChangeResult, passwordChangeError] = await user!.setPassword(
            "aaaaaaaaaaaaa"
        );

        expect(passwordChangeError).toBeDefined();
        expect(passwordChangeError).toHaveProperty("message");
        expect(passwordChangeResult).toBeUndefined();
    });

    it("should compare the password and return true if correct", async () => {
        const [user, userFindError] = await User.getUserByUsername("testUser");

        expect(userFindError).toBeNull();
        expect(user).toBeDefined();

        const [passwordValidationResult, passwordValidationError] = await user!.comparePassword(
            "jzJu3f7.jzJu3f7."
        );

        expect(passwordValidationError).toBeNull();
        expect(passwordValidationResult).toBeDefined();
        expect(passwordValidationResult).toBe(true);
    });

    it("should compare the password and return false if incorrect", async () => {
        const [user, userFindError] = await User.getUserByUsername("testUser");

        expect(userFindError).toBeNull();
        expect(user).toBeDefined();

        const [passwordValidationResult, passwordValidationError] = await user!.comparePassword(
            "incorrectPassword"
        );

        expect(passwordValidationError).toBeNull();
        expect(passwordValidationResult).toBeDefined();
        expect(passwordValidationResult).toBe(false);
    });

    it("should enable mfa for a user", async () => {
        const [user, userFindError] = await User.getUserByUsername("testUser");

        expect(userFindError).toBeNull();
        expect(user).toBeDefined();

        const [mfaEnableResult, mfaEnableError] = await user!.setUpMFA();

        expect(mfaEnableError).toBeNull();
        expect(mfaEnableResult).toBeDefined();
        expect(mfaEnableResult).toBeInstanceOf(String);

        expect(user?.mfaEnabled).toBe(false); // mfa is still in setup mode, not enabled yet
    });

    afterAll(async () => {
        await Dolphin.instance!.database.dropDatabase();
        Dolphin.destroy();
    });
});
