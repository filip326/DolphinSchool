import { Collection, ObjectId, WithId } from "mongodb";
import Dolphin from "../Dolphin";
import MethodResult, { DolphinErrorTypes } from "../MethodResult";
import TutCourse from "../Tut/TutCourse";
import Subject from "./Subject";


interface ICourse {
    teacher: ObjectId;
    subject: ObjectId; // tut-kurse?

    type:
    "LK" // Leistungskurs in Sek II
    | "GK" // Grundkurs in Sek II
    | "single-class" // Unterricht im Klassenverband in Sek 1
    | "out-of-class"; // Unterricht außerhalb des Klassenverbandes in Sek 1

    grade: number; // 5-13; 11 = E, 12 = Q1/2, 13 = Q3/4
    name: string;
    // LK: grade + subject + LK <number> + teacher's name
    // GK: grade + subject + GK <number> + teacher's name
    // single-class: class-name + subject
    // out-of-class: grade-level + subject + number

    number?: number; // for LK/GK and out-of-class courses

    students: ObjectId[];
    // each student needs to be in a linked tut to be added to the course
    linkedTuts: ObjectId[]; // for a single-class course, just one tut. Otherwise all tuts students from are in.

    guestTuts?: ObjectId[]; // for single-class courses, to add students from other classes if needed (e.g. guest students)

    schoolYear: number; // just the first year of the school year; 2020-2021 = 2021, 2021-2022 = 2022, etc.
    semester: 0 | 1 | 2; // 0 = full year, 1 = first semester, 2 = second semester

}

type CreateCourseOptions = {
    type: "LK" | "GK" | "single-class" | "out-of-class";
    teacher: ObjectId;
    subject: ObjectId;
    schoolYear: ICourse["schoolYear"];
    semester: ICourse["semester"];
    grade: ICourse["grade"];
    number?: ICourse["number"];
};

type CreateSingleClassCourseOptions = CreateCourseOptions & { type: "single-class"; linkedTuts: [ObjectId] };

function isCreateClassCourseOptions(options: any): options is CreateSingleClassCourseOptions {
    if (options.type !== "single-class") return false;
    if (!options.linkedTuts) return false;
    if (!Array.isArray(options.linkedTuts)) return false;
    if (options.linkedTuts.length !== 1) return false;
    if (!(options.linkedTuts[0] instanceof ObjectId)) return false;
    return true;
}

class Course implements WithId<ICourse> {

    static async create(course: CreateCourseOptions): Promise<MethodResult<Course>> {
        switch (course.type) {
            case "single-class":
                return await this.createSingleClassCourse(course);
            case "out-of-class":
                return await this.createOutOfClassCourse(course);
            case "LK":
            case "GK":
                return await this.createLkOrGkCourse(course);
            default:
                return [undefined, DolphinErrorTypes.INVALID_ARGUMENT];
        }
    }

    private static async createSingleClassCourse(course: CreateCourseOptions): Promise<MethodResult<Course>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const courses = dolphin.database.collection<ICourse>("courses");

        if (!isCreateClassCourseOptions(course)) return [undefined, DolphinErrorTypes.INVALID_ARGUMENT];

        // create a name for the course
        // since it is a single-class course, the name is just the class name + subject
        // get the class name
        const [linkedTutCourse, linkedTutFindError] = await TutCourse.getTutCourseById(course.linkedTuts[0]);
        if (linkedTutFindError) return [undefined, linkedTutFindError];
        const { name: className } = linkedTutCourse;

        // get the short subject name
        const [subject, subjectFindError] = await Subject.getSubjectById(course.subject);
        if (subjectFindError) return [undefined, subjectFindError];
        const { short: subjectName } = subject;

        // smush them together
        const courseName = `${className} ${subjectName}`;

        // check if the course already exists
        const checkForAlreadyExistingCourse = await courses.countDocuments({ name: courseName });
        if (checkForAlreadyExistingCourse > 0) return [undefined, DolphinErrorTypes.ALREADY_EXISTS];

        // create the course
        const courseToCreate: ICourse = {
            teacher: course.teacher,
            subject: course.subject,
            type: course.type,
            grade: course.grade,
            name: courseName,
            students: [],
            linkedTuts: course.linkedTuts,
            schoolYear: course.schoolYear,
            semester: course.semester
        };
        // insert into database
        const insertResult = await courses.insertOne(courseToCreate);
        if (!insertResult.acknowledged) return [undefined, DolphinErrorTypes.DATABASE_ERROR];

        // return the course
        return [
            new Course({ _id: insertResult.insertedId, ...courseToCreate }, courses),
            null
        ];
    }

    public static async createOutOfClassCourse(options: CreateCourseOptions): Promise<MethodResult<Course>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const courses = dolphin.database.collection<ICourse>("courses");

        // create a name for the course
        // since it is a out-of-class course, the name is the grade-level + subject + number
        // get the short subject name
        const [subject, subjectFindError] = await Subject.getSubjectById(options.subject);
        if (subjectFindError) return [undefined, subjectFindError];
        const { short: subjectName } = subject;

        // get the grade-level
        const gradeLevel = options.grade;

        // get the number
        // to get the number, we need to count all subjects with the same start of the name
        const countResult = await courses.countDocuments({
            name: {
                $regex: `^${gradeLevel} ${subjectName}`,
            }
        });

        // create the name
        const courseName = `${gradeLevel} ${subjectName} ${countResult + 1}`;

        // check if the course already exists
        const checkForAlreadyExistingCourse = await courses.countDocuments({ name: courseName });
        if (checkForAlreadyExistingCourse > 0) return [undefined, DolphinErrorTypes.FAILED]; // failed, since it should never happen

        // create the course, insert and return it
        const courseToCreate: ICourse = {
            teacher: options.teacher,
            subject: options.subject,
            type: options.type,
            grade: options.grade,
            name: courseName,
            students: [],
            linkedTuts: [],
            schoolYear: options.schoolYear,
            semester: options.semester
        };

        // insert into database
        const insertResult = await courses.insertOne(courseToCreate);
        if (!insertResult.acknowledged) return [undefined, DolphinErrorTypes.DATABASE_ERROR];

        return [
            new Course({
                _id: insertResult.insertedId,
                ...courseToCreate
            }, courses),
            null
        ];

    }

    private static async createLkOrGkCourse(options: CreateCourseOptions): Promise<MethodResult<Course>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const courses = dolphin.database.collection<ICourse>("courses");

        // create a name for the course
        // since it is a LK/GK course, the name is the grade-level (E, Q1/2, Q3/4) + subject + LK/GK + number
        // get the short subject name
        const [subject, subjectFindError] = await Subject.getSubjectById(options.subject);
        if (subjectFindError) return [undefined, subjectFindError];
        const { short: subjectName } = subject;

        // get the grade-level
        if (options.grade < 11 || options.grade > 13) return [undefined, DolphinErrorTypes.INVALID_ARGUMENT];
        const gradeLevel = options.grade === 11 ? "E" : options.grade === 12 ? "Q1/2" : "Q3/4";

        // get the number
        if (!options.number) return [undefined, DolphinErrorTypes.INVALID_ARGUMENT];
        const number = options.number;

        // smush them together
        const courseName = `${gradeLevel} ${subjectName} ${options.type} ${number}`;

        // check if the course already exists
        const checkForAlreadyExistingCourse = await courses.countDocuments({ name: courseName });
        if (checkForAlreadyExistingCourse > 0) return [undefined, DolphinErrorTypes.ALREADY_EXISTS];

        // create the course
        const courseToCreate: ICourse = {
            teacher: options.teacher,
            subject: options.subject,
            type: options.type,
            grade: options.grade,
            name: courseName,
            number,
            students: [],
            linkedTuts: [],
            schoolYear: options.schoolYear,
            semester: options.semester
        };
        // insert into database
        const insertResult = await courses.insertOne(courseToCreate);
        if (!insertResult.acknowledged) return [undefined, DolphinErrorTypes.DATABASE_ERROR];
        return [
            new Course({ _id: insertResult.insertedId, ...courseToCreate }, courses),
            null
        ];
    }

    _id: ObjectId;
    teacher: ObjectId;
    subject: ObjectId;

    type:
        "LK" // Leistungskurs in Sek II
        | "GK" // Grundkurs in Sek II
        | "single-class" // Unterricht im Klassenverband in Sek 1
        | "out-of-class"; // Unterricht außerhalb des Klassenverbandes in Sek 1

    grade: number;
    name: string;
    number?: number;

    students: ObjectId[];
    linkedTuts: ObjectId[];
    guestTuts?: ObjectId[];

    schoolYear: number;
    semester: 0 | 1 | 2;

    private readonly collection: Collection<ICourse>;

    private constructor(course: WithId<ICourse>, collection: Collection<ICourse>) {
        this._id = course._id;
        this.teacher = course.teacher;
        this.subject = course.subject;
        this.type = course.type;
        this.grade = course.grade;
        this.name = course.name;
        this.number = course.number;
        this.students = course.students;
        this.linkedTuts = course.linkedTuts;
        this.guestTuts = course.guestTuts;
        this.schoolYear = course.schoolYear;
        this.semester = course.semester;
        this.collection = collection;
    }
}

export default Course;
export { ICourse };
