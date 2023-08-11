import Dolphin from "../Dolphin";
import MethodResult from "../MethodResult";
import Teacher from "../User/Teacher/Teacher";
import { Collection, ObjectId, WithId } from "mongodb";

interface ISubject {
    longName: string;
    short: string;
    color: { r: number; g: number; b: number };
    teachers: ObjectId[];
    main: boolean; // Hauptfach ja/nein
}

interface SubjectSearchOptions {
    id?: ObjectId;
    long?: string;
    short?: string;
    teacher?: string;
    main?: boolean;
}

class Subject implements ISubject {
    static async list(): Promise<MethodResult<Subject[]>> {
        try {
            const dolphin = Dolphin.instance;
            if (!dolphin) throw Error("Dolphin not initialized");
            const dbResult = await dolphin.database.collection<ISubject>("subjects").find({});
            return [
                (await dbResult.toArray()).map(
                    (subject) =>
                        new Subject(dolphin.database.collection<ISubject>("subjects"), subject)
                ),
                null
            ];
        } catch {
            return [undefined, Error("Database error")];
        }
    }

    static async search(options: SubjectSearchOptions) {
        try {
            const dolphin = Dolphin.instance;
            if (!dolphin) throw Error("Dolphin not initialized");
            const dbResult = await dolphin.database.collection<ISubject>("subjects").find({
                _id: options.id,
                long: options.long,
                short: options.short,
                teacher: options.teacher,
                main: options.main
            });
            return [await dbResult.toArray(), null];
        } catch {
            return [undefined, Error("Database error")];
        }
    }

    static async create(subject: ISubject): Promise<MethodResult<Subject>> {
        try {
            const dolphin = Dolphin.instance;
            if (!dolphin) throw Error("Dolphin not initialized");
            const dbResult = await dolphin.database
                .collection<ISubject>("subjects")
                .insertOne(subject);
            if (dbResult.acknowledged) {
                return [
                    new Subject(dolphin.database.collection<ISubject>("subjects"), {
                        ...subject,
                        _id: dbResult.insertedId
                    }),
                    null
                ];
            } else {
                return [undefined, Error("Failed to create subject")];
            }
        } catch {
            return [undefined, Error("Failed to create subject")];
        }
    }

    _id: ObjectId;
    longName: string;
    short: string;
    color: { r: number; g: number; b: number };
    teachers: ObjectId[];
    main: boolean;

    private readonly subjectCollection: Collection<ISubject>;

    constructor(subjectColletion: Collection<ISubject>, subject: WithId<ISubject>) {
        this.subjectCollection = subjectColletion;
        this._id = subject._id;
        this.longName = subject.longName;
        this.short = subject.short;
        this.color = subject.color;
        this.teachers = subject.teachers;
        this.main = subject.main;
    }

    /**
     * Add a teacher to the subject
     * @param teacher Teacher
     */
    async addTeacher(teacher: Teacher): Promise<MethodResult<boolean>> {
        this.teachers.push(teacher._id);

        try {
            const dbResult = await this.subjectCollection.updateOne(
                { _id: this._id },
                { $push: { teachers: teacher._id } }
            );
            if (dbResult.acknowledged) {
                return [true, null];
            } else {
                return [undefined, Error("Failed to add teacher")];
            }
        } catch {
            return [undefined, Error("Failed to add teacher")];
        }
    }

    /**
     * Remove a teacher from the subject
     * @param teacher Teacher
     */
    async removeTeacher(teacher: Teacher): Promise<MethodResult<boolean>> {
        this.teachers = this.teachers.filter((t) => t !== teacher._id);

        try {
            const dbResult = await this.subjectCollection.updateOne(
                { _id: this._id },
                { $pull: { teachers: teacher._id } }
            );
            if (dbResult.acknowledged) {
                return [true, null];
            } else {
                return [undefined, Error("Failed to remove teacher")];
            }
        } catch {
            return [undefined, Error("Failed to remove teacher")];
        }
    }

    /**
     * Delete the subject
     * @returns [result, error] | [undefined, error]
     */
    async delete(): Promise<MethodResult<boolean>> {
        try {
            const dbResult = await this.subjectCollection.deleteOne({
                _id: this._id
            });
            if (dbResult.acknowledged) {
                return [true, null];
            } else {
                return [undefined, Error("Failed to delete subject")];
            }
        } catch {
            return [undefined, Error("Failed to delete subject")];
        }
    }
}

export default Subject;
export { ISubject, SubjectSearchOptions };
