import Subject from "../Course/Subject";
import Dolphin from "../Dolphin";
import { config } from "dotenv";
import User from "../User/User";
import Teacher from "../User/Teacher/Teacher";

config();

describe("Subject class", () => {
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

    it("should create a new subject", async () => {
        const [subject, subjectCreateError] = await Subject.create({
            longName: "Mathematics",
            short: "M",
            main: true,
            color: {
                r: 0,
                g: 0,
                b: 255
            },
            teachers: []
        });

        expect(subjectCreateError).toBeUndefined();
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
            username: "johndoe"
        });

        expect(teacherCreateError).toBeUndefined();
        expect(teacher).toBeDefined();

        // create a subject
        const [subject, subjectCreateError] = await Subject.create({
            longName: "Mathematics",
            short: "M",
            main: true,
            color: {
                r: 0,
                g: 0,
                b: 255
            },
            teachers: [teacher!.id]
        });

        expect(subjectCreateError).toBeUndefined();
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
            username: "johndoe"
        });

        expect(teacherCreateError).toBeUndefined();
        expect(teacher).toBeDefined();

        // create a subject
        const [subject, subjectCreateError] = await Subject.create({
            longName: "Mathematics",
            short: "M",
            main: true,
            color: {
                r: 0,
                g: 0,
                b: 255
            },
            teachers: [teacher!.id]
        });

        expect(subjectCreateError).toBeUndefined();
        expect(subject).toBeDefined();
        expect(subject!.longName).toBe("Mathematics");
        expect(subject!.short).toBe("M");
        expect(subject!.main).toBe(true);
        expect(subject!.teachers).toEqual([teacher!.id]);

        const [teacher2, teacher2Err] = await User.getUserById(subject!.teachers[0]);
        expect(teacher2Err).toBeUndefined();
        expect(teacher2).toBeDefined();

        subject?.removeTeacher(teacher2! as Teacher);

        expect(subject!.teachers).toEqual([]);
    });

    afterAll(async () => {
        await Dolphin.instance!.database.dropDatabase();
        Dolphin.destroy();
    });
});
