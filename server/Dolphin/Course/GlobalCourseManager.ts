import { Collection, Db } from "mongodb"
import Course, { ICourse } from "./Course"
import MethodResult from "../MethodResult"
import FindCourseOptions from "./FindCourseOptions"
import SearchCourseOptions from "./SearchCourseOptions"
import CreateCourseOptions from "./CreateCourseOptions"
import Dolphin from "../Dolphin"
import User from "../User/User"

class GlobalCourseManager {
    private readonly courseCollection: Collection<ICourse>

    private static instance: GlobalCourseManager

    private constructor(db: Db) {
        this.courseCollection = db.collection<ICourse>("cources")
    }

    public static getInstance(dolphin: Dolphin): GlobalCourseManager {
        if (GlobalCourseManager.instance) {
            return GlobalCourseManager.instance
        }

        GlobalCourseManager.instance = new GlobalCourseManager(dolphin.database)
        return GlobalCourseManager.instance
    }

    /**
     * Search multiple courses by options
     * @param options SearchCourseOptions
     * @returns Array of Courses | undefined
     */
    async searchCourses(options: SearchCourseOptions): Promise<MethodResult<Course[]>> {
        if (options.nameQuery) {
            try {
                const dbResult = await this.courseCollection.find({
                    name: { $regex: options.nameQuery ?? "" },
                }).skip(options.skip ?? 0)

                if (options.max) {
                    dbResult.limit(options.max)
                }
                return [(await dbResult.toArray()).map((cource) => new Course(this.courseCollection, cource)), null]
            } catch {
                return [undefined, Error("Database error")]
            }
        }

        return [undefined, Error("SearchCourceOptions invalid")]
    }

    /**
     * find a course by options
     * @param options FindCourseOptions
     * @returns Course | undefined
     */
    async findCourse(options: FindCourseOptions): Promise<MethodResult<Course>> {
        if (options.id) {
            try {
                const dbResult = await this.courseCollection.findOne({ _id: options.id })
                if (dbResult) {
                    const cource = new Course(this.courseCollection, dbResult)
                    return [cource, null]
                }
                return [undefined, Error("Cource not found")]
            } catch {
                return [undefined, Error("Database error")]
            }
        }

        if (options.name) {
            try {
                const dbResult = await this.courseCollection.findOne({ name: options.name })
                if (dbResult) {
                    const cource = new Course(this.courseCollection, dbResult)
                    return [cource, null]
                }
                return [undefined, Error("Cource not found")]
            } catch {
                return [undefined, Error("Database error")]
            }
        }

        return [undefined, Error("FindCourceOptions invalid")]
    }

    /**
     * Create a new course
     * @param options CreateCourseOptions
     * @returns the new Course | undefined
     */
    async createCource(options: CreateCourseOptions): Promise<MethodResult<Course>> {
        try {
            const newCourse = await this.courseCollection.insertOne({
                name: options.name,
                subject: options.subject,
                teacherIds: [options.teacher],
                userIds: [],
            })

            if (!newCourse.acknowledged) {
                return [undefined, Error("Database error")]
            }

            const course = new Course(this.courseCollection, {
                _id: newCourse.insertedId,
                name: options.name,
                subject: options.subject,
                teacherIds: [options.teacher],
                userIds: [],
            })

            return [course, null]
        } catch {
            return [undefined, Error("Database error")]
        }
    }

    /**
     * List all courses
     * @param options limit, skip
     * @returns Array of Courses | undefined
     */
    async list(options: { limit?: number, skip?: number }): Promise<MethodResult<Course[]>> {
        try {
            const courses = await this.courseCollection.find({}, { skip: options.skip, limit: options.limit || 10 }).toArray()
            return [courses.map((course) => new Course(this.courseCollection, course)), null]
        } catch {
            return [undefined, Error("Database error")]
        }
    }

    /**
     * returns all courses where all users are members in it
     * @param users 
     */
    async byMembers(...users: User[]) {
        const courses = await this.courseCollection.find({
            $and: [
                ...users.map(u => ({ $or: [ { userIds: u._id }, { teacherIds: u._id } ]}))
            ]
        }).toArray()

        return courses.map(c => new Course(this.courseCollection, c))
    }

    /**
     * determines, if there is a course, where all users are members in it or not
     */
    async sameCourse(...users: User[]) {
        return (await this.byMembers(...users)).length > 0
    }
}

export default GlobalCourseManager
