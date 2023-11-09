/* eslint-disable no-case-declarations */
import MethodResult from "../MethodResult";
import User from "../User/User";
import TutCourse from "../Tut/TutCourse";
import Course from "../Course/Course";

type ASMSQQueryType =
    | "user" // a user with a given name
    | "students_in_course" // all students in a given course
    | "students_in_tut" // all students in a tut course
    | "students_in_grade" // all students in a grade level (e.g. 5, 6, 7, 8, 9, 10, 11, 12)
    | "teachers_in_course" // all teachers teaching a given course
    | "teachers_in_tut" // all teachers teaching a tut course
    | "teachers_in_grade" // all teachers teaching a grade level (e.g. 5, 6, 7, 8, 9, 10, 11, 12)
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

export default class ASMSQ {
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
}
