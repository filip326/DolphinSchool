import { Collection, Db, ObjectId } from "mongodb"
import Subject, { ISubject } from "./Subject"
import MethodResult from "../MethodResult"
import Dolphin from "../Dolphin"

interface SubjectSearchOptions {
    id?: ObjectId;
    long?: string;
    short?: string;
    teacher?: string;
    main?: boolean;
}


class GlobalSubjectManager {

    subjectCollection: Collection<ISubject>

    private static instance: GlobalSubjectManager

    private constructor(database: Db) {
        this.subjectCollection = database.collection<ISubject>("subjects")
    }

    public static getInstance(dolphin: Dolphin): GlobalSubjectManager {
        if (GlobalSubjectManager.instance) {
            return GlobalSubjectManager.instance
        }
        GlobalSubjectManager.instance = new GlobalSubjectManager(dolphin.database)
        return GlobalSubjectManager.instance
    }

    async list(): Promise<MethodResult<Subject[]>> {
        try {
            const dbResult = await this.subjectCollection.find()
            return [(await dbResult.toArray()).map(subject => new Subject(this.subjectCollection, subject)), null]
        } catch {
            return [undefined, Error("Database error")]
        }
    }

    async search(options: SubjectSearchOptions) {
        try {
            const dbResult = await this.subjectCollection.find({
                _id: options.id,
                long: options.long,
                short: options.short,
                teacher: options.teacher,
                main: options.main
            })
            return [await dbResult.toArray(), null]
        } catch {
            return [undefined, Error("Database error")]
        }
    }

    async create(subject: ISubject): Promise<MethodResult<Subject>> {
        try {
            const dbResult = await this.subjectCollection.insertOne(subject)
            if (dbResult.acknowledged) {
                return [new Subject(this.subjectCollection, {
                    ...subject,
                    _id: dbResult.insertedId
                }), null]
            } else {
                return [undefined, Error("Failed to create subject")]
            }
        } catch {
            return [undefined, Error("Failed to create subject")]
        }
    }

}

export default GlobalSubjectManager
