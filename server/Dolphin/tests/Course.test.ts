import Course from "../Course/Course";
import Subject from "../Course/Subject";
import Dolphin from "../Dolphin";
import { config } from "dotenv";
import User from "../User/User";

config();

describe("Course class", () => {
    beforeEach(async () => {
        if (!process.env.DB_URL) throw Error("DB_URL not set in .env file");

        await Dolphin.init({
            prod: false,
            DB_URL: process.env.DB_URL,
            DB_NAME: "dolphinSchool--test--Course_class"
        });

        const db = Dolphin.instance!.database;

        // drop database before creating dummy users
        await db.dropDatabase();
    });

    it("should create a course", async () => {
        // create a teacher
        const [teacher, teacherCreateError] = await User.createUser({
            fullName: "John Doe",
            type: "teacher",
            username: "johndoe"
        });

        expect(teacherCreateError).toBeNull();
        expect(teacher).toBeDefined();

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

        expect(subjectCreateError).toBeNull();
        expect(subject).toBeDefined();

        if (!subject || !subject!._id) throw Error("subject._id is undefined");
        if (!teacher || !teacher!.id) throw Error("teacher._id is undefined");

        const [course, courseCreateError] = await Course.createCource({
            name: "Mathematics 1",
            subject: subject._id,
            teacher: teacher.id
        });

        expect(courseCreateError).toBeNull();
        expect(course).toBeDefined();
        expect(course!.name).toBe("Mathematics 1");
        expect(course!.subject).toBe(subject._id);
    });

    afterAll(async () => {
        await Dolphin.instance!.database.dropDatabase();
        Dolphin.destroy();
    });
});
