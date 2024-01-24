/* eslint-disable no-case-declarations */
import MethodResult, { DolphinErrorTypes } from "../MethodResult";
import User from "../User/User";
import TutCourse from "../Tut/TutCourse";
import Course from "../Course/Course";
import { ObjectId } from "mongodb";

type ASMSQQueryType =
    | "user" // a user with a given name
    | "students_in_course" // all students in a given course
    | "students_in_tut" // all students in a tut course
    | "teachers_in_course" // all teachers teaching a given course
    | "teachers_in_tut" // all teachers teaching a tut course
    | "parents_of" // all parents of a given student
    | "parents_of_course" // all parents of students in a given course
    | "parents_of_tut"; // all parents of students in a tut course

type SpecialASMSQQuery =
    | "all_students" // all students
    | "all_teachers" // all teachers
    | "all_parents" // all parents
    | "everyone"; // all users

interface ParsedASMSQResult {
    label: string;
    value: `${ASMSQQueryType}:${string}` | SpecialASMSQQuery;
}

class ASMSQ {
    public static async suggest(
        query: string,
        specialPermissions: boolean = false, // needed for SpecialASMSQQuery queries
    ): Promise<MethodResult<ParsedASMSQResult[]>> {
        const result: ParsedASMSQResult[] = [];
        query = query.toLowerCase();

        if (specialPermissions) {
            // check if query is a special query
            if ("alle schüler".startsWith(query)) {
                result.push({
                    label: "Alle Schüler",
                    value: "all_students",
                });
            }
            if ("alle lehrer".startsWith(query)) {
                result.push({
                    label: "Alle Lehrer",
                    value: "all_teachers",
                });
            }
            if ("alle eltern".startsWith(query)) {
                result.push({
                    label: "Alle Eltern",
                    value: "all_parents",
                });
            }
            if ("alle".startsWith(query)) {
                result.push({
                    label: "Alle",
                    value: "everyone",
                });
            }
        }

        // second, check if query could be a user's name or teacher's abbreviation
        const [users, usersFindError] = await User.searchUsersByName(query, 5, 0);
        if (usersFindError) {
            return [undefined, usersFindError];
        }
        await Promise.all(
            users.map(
                (user) =>
                    new Promise<void>(async (resolve) => {
                        // if student, find tut course
                        if (user.isStudent()) {
                            const [tutCourse, tutCourseFindError] =
                                await TutCourse.getTutCourseByUser(user._id);
                            if (tutCourseFindError) {
                                result.push({
                                    label: `${user.fullName} (Schüler:in)`,
                                    value: `user:${user._id.toHexString()}`,
                                });
                                resolve();
                                return;
                            }
                            result.push({
                                label: `${user.fullName} (${tutCourse.name})`,
                                value: `user:${user._id}`,
                            });
                        } else if (user.isTeacher() && user.kuerzel) {
                            result.push({
                                label: `${user.fullName} (Lehrkraft, ${user.kuerzel})`,
                                value: `user:${user._id}`,
                            });
                        } else if (user.isTeacher()) {
                            result.push({
                                label: `${user.fullName} (Lehrkraft)`,
                                value: `user:${user._id}`,
                            });
                        } else {
                            result.push({
                                label: `${user.fullName}`,
                                value: `user:${user._id}`,
                            });
                        }
                    }),
            ),
        );

        let courseQuery = "";
        // third, check if query could be a tut course name
        if (query.startsWith("schüler in")) {
            courseQuery = query.substring("Schüler in".length).trim();
        } else if (query.startsWith("Lehrkräfte in")) {
            courseQuery = query.substring("Lehrkräfte in".length).trim();
        } else if (query.startsWith("Eltern von Schülern in")) {
            courseQuery = query.substring("Eltern von Schülern in".length).trim();
        } else {
            courseQuery = query;
        }
        const [courses, coursesFindError] = await TutCourse.searchTutCourseByName(
            courseQuery,
            0,
            5,
        );
        if (coursesFindError) {
            return [undefined, coursesFindError];
        }
        for (const course of courses) {
            if (query.startsWith("schüler in") || courseQuery === query)
                result.push({
                    label: `Schüler in ${course.name}`,
                    value: `students_in_tut:${course._id}`,
                });
            if (query.startsWith("lehrkräfte in") || courseQuery === query)
                result.push({
                    label: `Lehrkräfte in ${course.name}`,
                    value: `teachers_in_tut:${course._id}`,
                });
            if (query.startsWith("eltern von schülern in") || courseQuery === query)
                result.push({
                    label: `Eltern von Schülern in ${course.name}`,
                    value: `parents_of_tut:${course._id}`,
                });
        }

        // next, check if query could be a course (not tut course) name
        const [courses2, coursesFindError2] = await Course.searchCourseByName(
            courseQuery,
            0,
            5,
        );
        if (coursesFindError2) {
            return [undefined, coursesFindError2];
        }
        for (const course of courses2) {
            if (query.startsWith("schüler in") || courseQuery === query)
                result.push({
                    label: `Schüler in ${course.name}`,
                    value: `students_in_course:${course._id}`,
                });
            if (query.startsWith("lehrkräfte in") || courseQuery === query)
                result.push({
                    label: `Lehrkräfte in ${course.name}`,
                    value: `teachers_in_course:${course._id}`,
                });
            if (query.startsWith("eltern von schülern in") || courseQuery === query)
                result.push({
                    label: `Eltern von Schülern in ${course.name}`,
                    value: `parents_of_course:${course._id}`,
                });
        }

        return [result, null];
    }

    async convertToUsers(
        query: string,
        specialPermissions: boolean = false,
    ): Promise<MethodResult<User[]>> {
        if (!this.isAsmsqQuery(query)) {
            return [undefined, DolphinErrorTypes.INVALID_ARGUMENT];
        }

        const type = query.split(":")[0] as ASMSQQueryType | SpecialASMSQQuery;

        switch (type) {
            case "all_students":
                if (!specialPermissions) {
                    return [undefined, DolphinErrorTypes.NOT_AUTHORIZED];
                }
                return User.listUsers({}, { type: "student" });

            case "all_teachers":
                if (!specialPermissions) {
                    return [undefined, DolphinErrorTypes.NOT_AUTHORIZED];
                }
                return User.listUsers({}, { type: "teacher" });

            case "all_parents":
                if (!specialPermissions) {
                    return [undefined, DolphinErrorTypes.NOT_AUTHORIZED];
                }
                return User.listUsers({}, { type: "parent" });

            case "everyone":
                if (!specialPermissions) {
                    return [undefined, DolphinErrorTypes.NOT_AUTHORIZED];
                }
                return User.listUsers({});

            case "user":
                const userId = query.split(":")[1];
                const [user, userFindError] = await User.getUserById(
                    ObjectId.createFromHexString(userId),
                );
                if (userFindError) {
                    return [undefined, userFindError];
                }
                return [[user], null];

            case "students_in_course":
                const courseId = query.split(":")[1];
                const [course, courseFindError] = await Course.getById(
                    ObjectId.createFromHexString(courseId),
                );
                if (courseFindError) {
                    return [undefined, courseFindError];
                }
                return User.listUsers({}, { _id: { $in: course.students } });

            case "students_in_tut":
                const tutCourseId = query.split(":")[1];
                const [tutCourse, tutCourseFindError] = await TutCourse.getTutCourseById(
                    ObjectId.createFromHexString(tutCourseId),
                );
                if (tutCourseFindError) {
                    return [undefined, tutCourseFindError];
                }
                return User.listUsers({}, { _id: { $in: tutCourse.students } });

            case "teachers_in_course":
                const courseId2 = query.split(":")[1];
                const [course2, courseFindError2] = await Course.getById(
                    ObjectId.createFromHexString(courseId2),
                );
                if (courseFindError2) {
                    return [undefined, courseFindError2];
                }
                return User.listUsers({}, { _id: { $in: course2.teacher } });

            case "teachers_in_tut":
                const tutCourseId2 = query.split(":")[1];
                const [tutCourse2, tutCourseFindError2] =
                    await TutCourse.getTutCourseById(
                        ObjectId.createFromHexString(tutCourseId2),
                    );
                if (tutCourseFindError2) {
                    return [undefined, tutCourseFindError2];
                }
                return User.listUsers(
                    {},
                    {
                        $or: [
                            { _id: tutCourse2.teacher },
                            { _id: tutCourse2.viceTeacher },
                        ],
                    },
                );

            case "parents_of":
                const studentId = query.split(":")[1];
                const [student, studentFindError] = await User.getUserById(
                    ObjectId.createFromHexString(studentId),
                );
                if (studentFindError) {
                    return [undefined, studentFindError];
                }
                return User.listUsers({}, { _id: { $in: student.parents } });

            case "parents_of_tut":
                const tutCourseId3 = query.split(":")[1];
                const [tutCourse3, tutCourseFindError3] =
                    await TutCourse.getTutCourseById(
                        ObjectId.createFromHexString(tutCourseId3),
                    );
                if (tutCourseFindError3) {
                    return [undefined, tutCourseFindError3];
                }
                const [students3, studentsFindError3] = await User.listUsers(
                    {},
                    { _id: { $in: tutCourse3.students } },
                );
                if (studentsFindError3) {
                    return [undefined, studentsFindError3];
                }
                return User.listUsers(
                    {},
                    {
                        _id: {
                            $in: students3
                                .map((student) => student.parents)
                                .flat()
                                .filter((v) => !!v) as ObjectId[],
                        },
                    },
                );

            case "parents_of_course":
                const courseId3 = query.split(":")[1];
                const [course3, courseFindError3] = await Course.getById(
                    ObjectId.createFromHexString(courseId3),
                );
                if (courseFindError3) {
                    return [undefined, courseFindError3];
                }
                const [students4, studentsFindError4] = await User.listUsers(
                    {},
                    { _id: { $in: course3.students } },
                );
                if (studentsFindError4) {
                    return [undefined, studentsFindError4];
                }
                return User.listUsers(
                    {},
                    {
                        _id: {
                            $in: students4
                                .map((student) => student.parents)
                                .flat()
                                .filter((v) => !!v) as ObjectId[],
                        },
                    },
                );

            default:
                return [undefined, DolphinErrorTypes.FAILED];
        }
    }

    private isAsmsqQuery(query: string): boolean {
        if (
            [
                "user",
                "students_in_course",
                "students_in_tut",
                "teachers_in_course",
                "teachers_in_tut",
                "parents_of",
                "parents_of_course",
                "parents_of_tut",
            ].some(
                (type) =>
                    query.startsWith(`${type}:`) &&
                    query.length === type.length + 1 + 24 && //1 = column, 24 = length of ObjectId (hex string)
                    /^[a-z_]+:[a-f0-9]{24}$/.test(query), // check if query is in format [type]:[ObjectId]
            )
        ) {
            return true;
        }

        if (["all_students", "all_teachers", "all_parents", "everyone"].includes(query)) {
            return true;
        }

        return false;
    }
}

export default ASMSQ;
export { ParsedASMSQResult };
