import Subject from "../Course/Subject";
import Dolphin from "../Dolphin";
import { config } from "dotenv";
import User from "../User/User";

config();

describe("Subject class", () => {
    beforeEach(async () => {
        if (!process.env.DB_URL) throw Error("DB_URL not set in .env file");

        await Dolphin.init({
            prod: false,
            DB_URL: process.env.DB_URL,
            DB_NAME: "dolphinSchool--test--Subject_class",
        });

        const db = Dolphin.instance!.database;

        // drop database before creating dummy users
        await db.dropDatabase();
    });

    it("should create a new subject", async () => {
        const [subject, subjectCreateError] = await Subject.create({
            longName: "Mathematics",
            short: "M",
            main: true,
            color: {
                r: 0,
                g: 0,
                b: 255,
            },
            teachers: [],
        });

        expect(subjectCreateError).toBeNull();
        expect(subject).toBeDefined();
        expect(subject!.longName).toBe("Mathematics");
        expect(subject!.short).toBe("M");
        expect(subject!.main).toBe(true);
        expect(subject!.teachers).toEqual([]);
    });

    it("should create a new subject with a teacher", async () => {
        // create a teacher
        const [teacher, teacherCreateError] = await User.createUser({
            fullName: "John Doe",
            type: "teacher",
            username: "johndoe",
        });

        expect(teacherCreateError).toBeNull();
        expect(teacher).toBeDefined();

        // create a subject
        const [subject, subjectCreateError] = await Subject.create({
            longName: "Mathematics",
            short: "M",
            main: true,
            color: {
                r: 0,
                g: 0,
                b: 255,
            },
            teachers: [teacher!.id],
        });

        expect(subjectCreateError).toBeNull();
        expect(subject).toBeDefined();
        expect(subject!.longName).toBe("Mathematics");
        expect(subject!.short).toBe("M");
        expect(subject!.main).toBe(true);
        expect(subject!.teachers).toEqual([teacher!.id]);
        expect(User.getUserById(subject!.teachers[0])).resolves.toBeDefined();
    });

    it("should create a new subject with a teacher and remove it", async () => {
        // create a teacher
        const [teacher, teacherCreateError] = await User.createUser({
            fullName: "John Doe",
            type: "teacher",
            username: "johndoe",
        });

        expect(teacherCreateError).toBeNull();
        expect(teacher).toBeDefined();

        // create a subject
        const [subject, subjectCreateError] = await Subject.create({
            longName: "Mathematics",
            short: "M",
            main: true,
            color: {
                r: 0,
                g: 0,
                b: 255,
            },
            teachers: [teacher!.id],
        });

        expect(subjectCreateError).toBeNull();
        expect(subject).toBeDefined();
        expect(subject!.longName).toBe("Mathematics");
        expect(subject!.short).toBe("M");
        expect(subject!.main).toBe(true);
        expect(subject!.teachers).toEqual([teacher!.id]);

        const [teacher2, teacher2Err] = await User.getUserById(subject!.teachers[0]);
        expect(teacher2Err).toBeNull();
        expect(teacher2).toBeDefined();
        expect(teacher2!._id).toEqual(teacher!.id);

        await subject?.removeTeacher(teacher2!);

        expect(subject!.teachers).toEqual([]);
    });

    afterAll(async () => {
        await Dolphin.instance!.database.dropDatabase();
        Dolphin.destroy();
    });
});
