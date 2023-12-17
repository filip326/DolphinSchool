/* eslint-disable no-case-declarations */
import MethodResult from "../MethodResult";
import User from "../User/User";
import TutCourse from "../Tut/TutCourse";
import Course from "../Course/Course";
import { ObjectId } from "mongodb";

type ASMSQQueryType =
    | "user" // a user with a given name
    | "students_in_course" // all students in a given course
    | "students_in_tut" // all students in a tut course
    | "students_in_grade" // all students in a grade level (e.g. 5, 6, 7, 8, 9, 10, 11, 12)
    | "teachers_in_course" // all teachers teaching a given course
    | "teachers_in_tut" // all teachers teaching a tut course
    | "parents_of" // all parents of a given student
    | "parents_of_course" // all parents of students in a given course
    | "parents_of_tut" // all parents of students in a tut course
    | "parents_of_grade"; // all parents of students in a grade level (e.g. 5, 6, 7, 8, 9, 10, 11, 12)

type SpecialASMSQQuery =
    | "all_students" // all students
    | "all_teachers" // all teachers
    | "all_parents" // all parents
    | "everyone"; // all users

interface ParsedASMSQResult {
    label: string;
    value: `${ASMSQQueryType}:${string}` | SpecialASMSQQuery;
}

type ASMSQQuery = `${ASMSQQueryType}:${string}`;

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
            5,
            0,
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
            5,
            0,
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

    public static async toUserIds(
        asmsq: ASMSQQuery[],
        specialPermissions?: false,
    ): Promise<MethodResult<ObjectId[]>>;
    public static async toUserIds(
        asmsq: (ASMSQQuery | SpecialASMSQQuery)[],
        specialPermissions: true,
    ): Promise<MethodResult<ObjectId[]>>;
    public static async toUserIds(
        asmsq: (ASMSQQuery | SpecialASMSQQuery)[],
        specialPermissions: boolean = false,
    ): Promise<MethodResult<ObjectId[]>> {
        const result: ObjectId[] = [];
        await Promise.all(
            asmsq.map(async (query: string) => {
                // check if query matches pattern
                if (!ASMSQ.isValid(query)) return; // ignore invalid queries

                // check if query is SpecialASMSQQuery
                if (
                    ["all_students", "all_teachers", "all_parents", "everyone"].includes(
                        query,
                    )
                ) {
                    if (!specialPermissions) return; // ignore special queries if specialPermissions is false
                    switch (query) {
                        case "all_students":
                            result.push(
                                ...((await User.listUsers({ type: "student" }))[0]?.map(
                                    (user) => user._id,
                                ) ?? []),
                            );
                            break;
                        case "all_teachers":
                            result.push(
                                ...((await User.listUsers({ type: "teacher" }))[0]?.map(
                                    (user) => user._id,
                                ) ?? []),
                            );
                            break;
                        case "all_parents":
                            result.push(
                                ...((await User.listUsers({ type: "student" }))[0]?.map(
                                    (user) => user._id,
                                ) ?? []),
                            );
                            break;
                        case "everyone":
                            result.push(
                                ...((await User.listUsers({}))[0]?.map(
                                    (user) => user._id,
                                ) ?? []),
                            );
                            break;
                    }
                    return;
                }

                switch (query.split(":")[0]) {
                    case "user":
                        if (!ObjectId.isValid(query.split(":")[1])) return;
                        // eslint-disable-next-line no-case-declarations
                        const [sendToUser, userFindError] = await User.getUserById(
                            new ObjectId(query.split(":")[1]),
                        );
                        if (userFindError) {
                            return;
                        }
                        result.push(sendToUser._id);
                        break;
                    case "students_in_course":
                        if (!ObjectId.isValid(query.split(":")[1])) return;
                        // eslint-disable-next-line no-case-declarations
                        const [course2, courseFindError2] = await Course.getById(
                            new ObjectId(query.split(":")[1]),
                        );
                        if (courseFindError2) {
                            return;
                        }
                        result.push(...course2.students);
                        break;

                    case "students_in_tut":
                        if (!ObjectId.isValid(query.split(":")[1])) return;
                        // eslint-disable-next-line no-case-declarations
                        const [tut, tutFindError] = await TutCourse.getTutCourseById(
                            new ObjectId(query.split(":")[1]),
                        );
                        if (tutFindError) {
                            return;
                        }
                        result.push(...tut.students);
                        break;

                    case "students_in_grade":
                        // eslint-disable-next-line no-case-declarations
                        const [tutCourses, tutCoursesError] =
                            await TutCourse.getTutCoursesByGradeLevel(
                                parseInt(query.split(":")[1]),
                            );
                        if (tutCoursesError) {
                            return;
                        }
                        result.push(
                            ...tutCourses.map((tutCourse) => tutCourse.students).flat(),
                        );
                        break;

                    case "teachers_in_course":
                        if (!ObjectId.isValid(query.split(":")[1])) return;
                        // eslint-disable-next-line no-case-declarations
                        const [course, courseFindError] = await Course.getById(
                            new ObjectId(query.split(":")[1]),
                        );
                        if (courseFindError) {
                            return;
                        }
                        result.push(...course.teacher);
                        break;
                    case "teachers_in_tut":
                        if (!ObjectId.isValid(query.split(":")[1])) return;
                        // eslint-disable-next-line no-case-declarations
                        const [tut2, tutFindError2] = await TutCourse.getTutCourseById(
                            new ObjectId(query.split(":")[1]),
                        );
                        if (tutFindError2) {
                            return;
                        }
                        result.push(tut2.teacher);
                        if (tut2.viceTeacher) result.push(tut2.viceTeacher);
                        // check for duplicates
                        break;

                    case "parents_of":
                        if (!ObjectId.isValid(query.split(":")[1])) return;
                        // eslint-disable-next-line no-case-declarations
                        const [student, studentFindError] = await User.getUserById(
                            new ObjectId(query.split(":")[1]),
                        );
                        if (studentFindError) {
                            return;
                        }
                        const [parents, parentsError] = await student.getParents();
                        if (parentsError) {
                            return;
                        }
                        result.push(...parents.map((parent) => parent._id));
                        break;

                    case "parents_of_course":
                        if (!ObjectId.isValid(query.split(":")[1])) return;
                        // eslint-disable-next-line no-case-declarations
                        const [course3, courseFindError3] = await Course.getById(
                            new ObjectId(query.split(":")[1]),
                        );
                        if (courseFindError3) {
                            return;
                        }
                        result.push(
                            ...(
                                await Promise.all(
                                    course3.students.map(async (studentId) => {
                                        const [student] =
                                            await User.getUserById(studentId);
                                        if (!student || !student.isStudent()) {
                                            return;
                                        }
                                        return (await student.getParents())[0];
                                    }),
                                )
                            )
                                .filter((value) => value != undefined)
                                .flat()
                                .map((value) => value!._id), // exclamation mark because we filtered out undefined values two lines above already.
                        );
                        break;

                    case "parents_of_tut":
                        if (!ObjectId.isValid(query.split(":")[1])) return;
                        // eslint-disable-next-line no-case-declarations
                        const [tut3, tutFindError3] = await TutCourse.getTutCourseById(
                            new ObjectId(query.split(":")[1]),
                        );
                        if (tutFindError3) {
                            return;
                        }
                        result.push(
                            ...(
                                await Promise.all(
                                    tut3.students.map(async (studentId) => {
                                        const [student] =
                                            await User.getUserById(studentId);
                                        if (!student || !student.isStudent()) {
                                            return;
                                        }
                                        return (await student.getParents())[0];
                                    }),
                                )
                            )
                                .filter((value) => value != undefined)
                                .flat()
                                .map((value) => value!._id), // exclamation mark because we filtered out undefined values two lines above already.
                        );
                        break;

                    case "parents_of_grade":
                        // eslint-disable-next-line no-case-declarations
                        const [tut4, tutFindError4] =
                            await TutCourse.getTutCoursesByGradeLevel(
                                parseInt(query.split(":")[1]),
                            );
                        if (tutFindError4) {
                            return;
                        }
                        result.push(
                            ...(
                                await Promise.all(
                                    tut4
                                        .map((tut) => tut.students)
                                        .flat()
                                        .map(async (studentId) => {
                                            const [student] =
                                                await User.getUserById(studentId);
                                            if (!student || !student.isStudent()) {
                                                return;
                                            }
                                            return (await student.getParents())[0];
                                        }),
                                )
                            )
                                .filter((value) => value != undefined)
                                .flat()
                                .map((value) => value!._id), // exclamation mark because we filtered out undefined values two lines above already.
                        );
                        break;
                }
            }),
        );

        return [result, null];
    }

    public static isValid(query: string): query is ASMSQQuery | SpecialASMSQQuery {
        // check if query is SpecialASMSQQuery
        if (["all_students", "all_teachers", "all_parents", "everyone"].includes(query)) {
            return true;
        }

        // check if query matches pattern {name}:{id}
        if (!query.includes(":")) return false;
        if (query.split(":").length !== 2) return false;

        if (
            ![
                "user",
                "students_in_course",
                "students_in_tut",
                "students_in_grade",
                "teachers_in_course",
                "teachers_in_tut",
                "parents_of",
                "parents_of_course",
                "parents_of_tut",
                "parents_of_grade",
            ].includes(query.split(":")[0])
        ) {
            return false;
        }

        return true;
    }
}

export default ASMSQ;
export { ASMSQQueryType, SpecialASMSQQuery, ParsedASMSQResult };
