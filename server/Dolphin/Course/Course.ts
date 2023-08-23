import { Collection, ObjectId, WithId } from "mongodb";
import SearchCourseOptions from "./SearchCourseOptions";
import MethodResult, { DolphinErrorTypes } from "../MethodResult";
import FindCourseOptions from "./FindCourseOptions";
import CreateCourseOptions from "./CreateCourseOptions";
import User from "../User/User";
import Dolphin from "../Dolphin";

interface ICourse {
    name: string;
    subject?: ObjectId;
    teacherIds: ObjectId[];
    userIds: ObjectId[];
}

class Course implements WithId<ICourse> {
    /**
     * Search multiple courses by options
     * @param options SearchCourseOptions
     * @returns Array of Courses | undefined
     */
    static async searchCourses(options: SearchCourseOptions): Promise<MethodResult<Course[]>> {
        if (options.nameQuery) {
            try {
                const dolphin = Dolphin.instance ?? await Dolphin.init(useRuntimeConfig());
                const dbResult = await dolphin?.database
                    .collection<ICourse>("cources")
                    .find({
                        name: {
                            $regex: options.nameQuery ?? ""
                        }
                    })
                    .skip(options.skip ?? 0);

                if (options.max) {
                    dbResult.limit(options.max);
                }
                return [
                    (await dbResult.toArray()).map(
                        (cource) =>
                            new Course(dolphin.database.collection<ICourse>("cources"), cource)
                    ),
                    null
                ];
            } catch {
                return [undefined, DolphinErrorTypes.DATABASE_ERROR];
            }
        }

        return [undefined, DolphinErrorTypes.INVALID_ARGUMENT];
    }

    /**
     * find a course by options
     * @param options FindCourseOptions
     * @returns Course | undefined
     */
    static async findCourse(options: FindCourseOptions): Promise<MethodResult<Course>> {
        if (options.id) {
            try {
                const dolphin = Dolphin.instance ?? await Dolphin.init(useRuntimeConfig());
                const dbResult = await dolphin?.database.collection<ICourse>("cources").findOne({
                    _id: options.id
                });
                if (dbResult) {
                    const cource = new Course(
                        dolphin.database.collection<ICourse>("cources"),
                        dbResult
                    );
                    return [cource, null];
                }
                return [undefined, DolphinErrorTypes.NOT_FOUND];
            } catch {
                return [undefined, DolphinErrorTypes.DATABASE_ERROR];
            }
        }

        if (options.name) {
            try {
                const dolphin = Dolphin.instance ?? await Dolphin.init(useRuntimeConfig());
                const dbResult = await dolphin?.database.collection<ICourse>("cources").findOne({
                    name: options.name
                });
                if (dbResult) {
                    const cource = new Course(
                        dolphin.database.collection<ICourse>("cources"),
                        dbResult
                    );
                    return [cource, null];
                }
                return [undefined, DolphinErrorTypes.NOT_FOUND];
            } catch {
                return [undefined, DolphinErrorTypes.DATABASE_ERROR];
            }
        }

        return [undefined, DolphinErrorTypes.INVALID_ARGUMENT];
    }

    /**
     * Create a new course
     * @param options CreateCourseOptions
     * @returns the new Course | undefined
     */
    static async createCource(options: CreateCourseOptions): Promise<MethodResult<Course>> {
        try {
            const dolphin = Dolphin.instance ?? await Dolphin.init(useRuntimeConfig());
            const newCourse = await dolphin?.database.collection<ICourse>("cources").insertOne({
                name: options.name,
                subject: options.subject,
                teacherIds: [options.teacher],
                userIds: []
            });

            if (!newCourse.acknowledged) {
                return [undefined, DolphinErrorTypes.DATABASE_ERROR];
            }

            const course = new Course(dolphin.database.collection<ICourse>("cources"), {
                _id: newCourse.insertedId,
                name: options.name,
                subject: options.subject,
                teacherIds: [options.teacher],
                userIds: []
            });

            return [course, null];
        } catch {
            return [undefined, DolphinErrorTypes.DATABASE_ERROR];
        }
    }

    /**
     * List all courses
     * @param options limit, skip
     * @returns Array of Courses | undefined
     */
    static async list(options: { limit?: number; skip?: number }): Promise<MethodResult<Course[]>> {
        try {
            const dolphin = Dolphin.instance ?? await Dolphin.init(useRuntimeConfig());
            const courses = await dolphin?.database
                .collection<ICourse>("cources")
                .find(
                    {},
                    {
                        skip: options.skip,
                        limit: options.limit || 10
                    }
                )
                .toArray();
            return [
                courses.map(
                    (course) => new Course(dolphin.database.collection<ICourse>("cources"), course)
                ),
                null
            ];
        } catch {
            return [undefined, DolphinErrorTypes.DATABASE_ERROR];
        }
    }

    /**
     * returns all courses where all users are members in it
     * @param users
     */
    static async byMembers(...users: User[]) {
        const dolphin = Dolphin.instance ?? await Dolphin.init(useRuntimeConfig());
        const courses = await dolphin?.database
            .collection<ICourse>("cources")
            .find({
                $and: [
                    ...users.map((u) => ({
                        $or: [
                            {
                                userIds: u._id
                            },
                            {
                                teacherIds: u._id
                            }
                        ]
                    }))
                ]
            })
            .toArray();

        return courses.map((c) => new Course(dolphin.database.collection<ICourse>("cources"), c));
    }

    /**
     * determines, if there is a course, where all users are members in it or not
     */
    static async sameCourse(...users: User[]) {
        return (await this.byMembers(...users)).length > 0;
    }

    _id: ObjectId;
    name: string;
    subject?: ObjectId;
    teacherIds: ObjectId[];
    userIds: ObjectId[];
    collection: Collection<ICourse>;

    constructor(collection: Collection<ICourse>, course: WithId<ICourse>) {
        this.collection = collection;
        this._id = course._id;
        this.name = course.name;
        this.subject = course.subject;
        this.teacherIds = course.teacherIds;
        this.userIds = course.userIds;
    }
}

export default Course;
export { ICourse };
