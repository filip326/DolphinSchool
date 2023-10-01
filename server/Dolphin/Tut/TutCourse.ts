import { Collection, ObjectId, WithId } from "mongodb";
import User from "../User/User";
import MethodResult, { DolphinErrorTypes } from "../MethodResult";
import Dolphin from "../Dolphin";

interface ITutCourse {
    grade: number; // 5-13; 11 = E, 12 = Q1/2, 13 = Q3/4
    name: string; // grade + letter in grades 5-10, grade + teacher's name in grades 11-13

    teacher: ObjectId;
    viceTeacher?: ObjectId;

    students: ObjectId[];
}

class TutCourse implements WithId<ITutCourse> {
    static async create(
        tutCourse: Omit<Omit<ITutCourse, "students">, "name"> & { letter?: string },
    ): Promise<MethodResult<ITutCourse>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const tutCourses = dolphin.database.collection<ITutCourse>("tutCourses");
        // get teacher's name
        const [teacher, teacherFindError] = await User.getUserById(tutCourse.teacher);
        if (teacherFindError) return [undefined, teacherFindError];

        // check if grade is valid
        if (tutCourse.grade < 5 || tutCourse.grade > 13)
            return [undefined, DolphinErrorTypes.INVALID_ARGUMENT];

        // if grade is 5-10, check if letter is valid and create the name accordingly
        let name: string;
        if (tutCourse.grade < 11) {
            if (!tutCourse.letter || tutCourse.letter.length !== 1)
                return [undefined, DolphinErrorTypes.INVALID_ARGUMENT];
            name = `${tutCourse.grade}${tutCourse.letter.toLowerCase()}`;
        } else {
            // if grade is 11-13, create the name accordingly
            // replace 11 with E1/2
            // replace 12 with Q1/2
            // replace 13 with Q3/4
            switch (tutCourse.grade) {
                case 11:
                    name = "E";
                    break;
                case 12:
                    name = "Q1/2";
                    break;
                case 13:
                    name = "Q3/4";
                    break;
                default:
                    return [undefined, DolphinErrorTypes.INVALID_ARGUMENT];
            }
            name += `_${teacher.kuerzel}`;
        }

        // check if the tut-course already exists
        const checkForAlreadyExistingCourse = await tutCourses.countDocuments({ name });
        if (checkForAlreadyExistingCourse > 0) return [undefined, DolphinErrorTypes.ALREADY_EXISTS];

        // create the tut-course
        const tutCourseToCreate: ITutCourse = {
            grade: tutCourse.grade,
            name,
            teacher: tutCourse.teacher,
            viceTeacher: tutCourse.viceTeacher,
            students: [],
        };
        const dbResult = await tutCourses.insertOne(tutCourseToCreate);
        if (dbResult.acknowledged) {
            return [
                new TutCourse({ ...tutCourseToCreate, _id: dbResult.insertedId }, tutCourses),
                null,
            ];
        }
        return [undefined, DolphinErrorTypes.FAILED];
    }

    static async getTutCourseById(id: ObjectId): Promise<MethodResult<TutCourse>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const tutCourses = dolphin.database.collection<ITutCourse>("tutCourses");
        const result = await tutCourses.findOne({ _id: id });
        if (result) {
            return [new TutCourse(result, tutCourses), null];
        }
        return [undefined, DolphinErrorTypes.NOT_FOUND];
    }

    static async getTutCourseByName(name: string): Promise<MethodResult<TutCourse>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const tutCourses = dolphin.database.collection<ITutCourse>("tutCourses");
        const result = await tutCourses.findOne({ name });
        if (result) {
            return [new TutCourse(result, tutCourses), null];
        }
        return [undefined, DolphinErrorTypes.NOT_FOUND];
    }

    static async getAutoCompleteTutCourses(
        name: string,
    ): Promise<MethodResult<{ name: string; value: ObjectId }[]>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const tutCourses = dolphin.database.collection<ITutCourse>("tutCourses");

        const result = (await tutCourses
            .find({
                // name starts with the name given, case insensitive
                name: { $regex: `^${name}`, $options: "i" },
            })
            .limit(10)
            // return only the name and the id
            .project({ name: 1, _id: 1 })
            .toArray()) as { name: string; _id: ObjectId }[];

        return [result.map((tutCourse) => ({ name: tutCourse.name, value: tutCourse._id })), null];
    }

    static async getTutCourseByUser(user: ObjectId): Promise<MethodResult<TutCourse>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const tutCourses = dolphin.database.collection<ITutCourse>("tutCourses");
        const result = await tutCourses.findOne({
            $or: [{ students: user }, { teacher: user }, { viceTeacher: user }],
        });
        if (result) {
            return [new TutCourse(result, tutCourses), null];
        }
        return [undefined, DolphinErrorTypes.NOT_FOUND];
    }

    _id: ObjectId;
    grade: number;
    name: string;
    teacher: ObjectId;
    viceTeacher?: ObjectId;
    students: ObjectId[];
    private readonly collection: Collection<ITutCourse>;

    private constructor(tutCourse: WithId<ITutCourse>, collection: Collection<ITutCourse>) {
        this._id = tutCourse._id;
        this.grade = tutCourse.grade;
        this.name = tutCourse.name;
        this.teacher = tutCourse.teacher;
        this.viceTeacher = tutCourse.viceTeacher;
        this.students = tutCourse.students;
        this.collection = collection;
    }

    async addStudent(student: ObjectId): Promise<MethodResult<boolean>> {
        const result = await this.collection.updateOne(
            { _id: this._id },
            { $push: { students: student } },
        );
        if (result.acknowledged) {
            return [true, null];
        }
        return [undefined, DolphinErrorTypes.FAILED];
    }

    async removeStudent(student: ObjectId): Promise<MethodResult<boolean>> {
        const result = await this.collection.updateOne(
            { _id: this._id },
            { $pull: { students: student } },
        );
        if (result.acknowledged) {
            return [true, null];
        }
        return [undefined, DolphinErrorTypes.FAILED];
    }

    async setTeacher(teacher: ObjectId): Promise<MethodResult<boolean>> {
        const result = await this.collection.updateOne({ _id: this._id }, { $set: { teacher } });
        if (result.acknowledged) {
            // check if class name needs to be updated
            if (this.grade > 10) {
                const [teacherUser, teacherUserError] = await User.getUserById(teacher);
                if (teacherUserError) return [undefined, teacherUserError];
                const name = `${this.grade}_${teacherUser.kuerzel}`;
                const result = await this.collection.updateOne(
                    { _id: this._id },
                    { $set: { name } },
                );
                if (result.acknowledged) {
                    return [true, null];
                }
                return [undefined, DolphinErrorTypes.FAILED];
            }
            return [true, null];
        }
        return [undefined, DolphinErrorTypes.FAILED];
    }

    async setViceTeacher(viceTeacher: ObjectId): Promise<MethodResult<boolean>> {
        const result = await this.collection.updateOne(
            { _id: this._id },
            { $set: { viceTeacher } },
        );
        if (result.acknowledged) {
            return [true, null];
        }
        return [undefined, DolphinErrorTypes.FAILED];
    }

    async delete(): Promise<MethodResult<boolean>> {
        const result = await this.collection.deleteOne({ _id: this._id });
        if (result.acknowledged) {
            return [true, null];
        }
        return [undefined, DolphinErrorTypes.FAILED];
    }
}

export default TutCourse;
export { ITutCourse };
