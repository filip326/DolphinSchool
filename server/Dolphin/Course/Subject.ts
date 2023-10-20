import Dolphin from "../Dolphin";
import MethodResult, { DolphinErrorTypes } from "../MethodResult";
import { Collection, ObjectId, WithId } from "mongodb";

interface ISubject {
    longName: string;
    short: string;
    color: { r: number; g: number; b: number };
}

interface SubjectSearchOptions {
    id?: ObjectId;
    long?: string;
    short?: string;
}

class Subject implements ISubject {
    static async list(): Promise<MethodResult<Subject[]>> {
        try {
            const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
            const dbResult = await dolphin.database.collection<ISubject>("subjects").find({});
            return [
                (await dbResult.toArray()).map(
                    (subject) =>
                        new Subject(dolphin.database.collection<ISubject>("subjects"), subject),
                ),
                null,
            ];
        } catch {
            return [undefined, DolphinErrorTypes.DATABASE_ERROR];
        }
    }

    static async search(query: string): Promise<MethodResult<Subject[]>> {
        try {
            const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
            const dbResult = await dolphin.database.collection<ISubject>("subjects").find({
                $or: [
                    { longName: { $regex: query, $options: "i" } },
                    { short: { $regex: query, $options: "i" } },
                ],
            });
            return [
                (await dbResult.toArray()).map(
                    (s) => new Subject(dolphin.database.collection<ISubject>("subjects"), s),
                ),
                null,
            ];
        } catch {
            return [undefined, DolphinErrorTypes.DATABASE_ERROR];
        }
    }

    static async create(subject: ISubject): Promise<MethodResult<Subject>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));

        if (
            (await dolphin.database.collection<ISubject>("subjects").countDocuments({
                $or: [{ longName: subject.longName }, { short: subject.short }],
            })) > 0
        ) {
            return [undefined, DolphinErrorTypes.ALREADY_EXISTS];
        }

        const dbResult = await dolphin.database.collection<ISubject>("subjects").insertOne(subject);
        if (dbResult.acknowledged) {
            return [
                new Subject(dolphin.database.collection<ISubject>("subjects"), {
                    ...subject,
                    _id: dbResult.insertedId,
                }),
                null,
            ];
        } else {
            return [undefined, DolphinErrorTypes.FAILED];
        }
    }

    static async getSubjectById(id: ObjectId): Promise<MethodResult<Subject>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const dbResult = await dolphin.database
            .collection<ISubject>("subjects")
            .findOne({ _id: id });
        if (dbResult) {
            return [new Subject(dolphin.database.collection<ISubject>("subjects"), dbResult), null];
        } else {
            return [undefined, DolphinErrorTypes.NOT_FOUND];
        }
    }

    _id: ObjectId;
    longName: string;
    short: string;
    color: { r: number; g: number; b: number };

    private readonly subjectCollection: Collection<ISubject>;

    constructor(subjectColletion: Collection<ISubject>, subject: WithId<ISubject>) {
        this.subjectCollection = subjectColletion;
        this._id = subject._id;
        this.longName = subject.longName;
        this.short = subject.short;
        this.color = subject.color;
    }

    /**
     * Delete the subject
     * @returns [result, error] | [undefined, error]
     */
    async delete(): Promise<MethodResult<boolean>> {
        try {
            const dbResult = await this.subjectCollection.deleteOne({
                _id: this._id,
            });
            if (dbResult.acknowledged) {
                return [true, null];
            } else {
                return [undefined, DolphinErrorTypes.FAILED];
            }
        } catch {
            return [undefined, DolphinErrorTypes.FAILED];
        }
    }
}

export default Subject;
export { ISubject, SubjectSearchOptions };
