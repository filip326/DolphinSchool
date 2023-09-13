import { Collection, ObjectId, WithId } from "mongodb";


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
    // out-of-class: class-name + subject + teacher's name + number

    number?: number; // for LK/GK and out-of-class courses

    students: ObjectId[];
    // each student needs to be in a linked tut to be added to the course
    linkedTuts: ObjectId[]; // for a single-class course, just one tut. Otherwise all tuts students from are in.

    guestTuts?: ObjectId[]; // for single-class courses, to add students from other classes if needed (e.g. guest students)

    schoolYear: number; // just the first year of the school year; 2020-2021 = 2021, 2021-2022 = 2022, etc.
    semester: 0 | 1 | 2; // 0 = full year, 1 = first semester, 2 = second semester

}

class Course implements WithId<ICourse> {

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
