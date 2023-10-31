/* eslint-disable no-case-declarations */
// import { ObjectId } from "mongodb";
import MethodResult from "../MethodResult";
// import ASMSQInterpreter, { ASMSQResult } from "./AdvancedSyntaxObject";
import User from "../User/User";
import TutCourse from "../Tut/TutCourse";
import Course from "../Course/Course";

type ASMSQResponseTypes =
    | "user" // represents a single user
    | "students_in_tut" // represents a list of students in a tut course
    | "students_in_course" // represents a list of students in a course
    | "teachers_in_tut" // represents a list of tutors in a tut course
    | "teachers_in_course" // represents a list of tutors in a course
    | "parents_in_course" // represents a course
    | "parents_in_tut"; // represents a tut course
interface ParsedASMSQResult {
    label: string;
    value: `${ASMSQResponseTypes}:${string}`;
}

class ASMSQ {
    public static async suggest(
        query: string,
    ): Promise<MethodResult<ParsedASMSQResult[]>> {
        const toBeReturned: ParsedASMSQResult[] = [];

        // check if the query could match a single user
        // - find at maximum 5 users whose name matches the query

        const [userMatches, userMatchesError] = await User.searchUsersByName(query, 5, 0);
        if (userMatchesError) {
            return [undefined, userMatchesError];
        }

        for await (const user of userMatches) {
            // if it is a student:
            // - get the tut course's name
            if (user.isStudent()) {
                const [tutCourse] = await TutCourse.getTutCourseByUser(user._id);
                if (!tutCourse) {
                    toBeReturned.push({
                        label: `${user.fullName} (Schüler:in)`,
                        value: `user:${user._id.toHexString()}`,
                    });
                } else {
                    toBeReturned.push({
                        label: `${user.fullName} (Schüler:in, ${tutCourse.name})`,
                        value: `user:${user._id.toHexString()}`,
                    });
                }
            }
            // if it is a teacher:
            // - just write the name (teacher)
            else if (user.isTeacher()) {
                toBeReturned.push({
                    label: `${user.fullName} (Lehrer:in)`,
                    value: `user:${user._id.toHexString()}`,
                });
            }
            // if it is a parent:
            // - get the student's tut course's name
            // - if multiple students assigned to one parent, get each tut course comma separated
            else if (user.isParent()) {
                const [students, studentsError] = await user.getStudents();
                if (studentsError) {
                    return [undefined, studentsError];
                }
                const tutCourseNames: string[] = [];
                for await (const student of students) {
                    const [tutCourse] = await TutCourse.getTutCourseByUser(student._id);
                    if (tutCourse) {
                        tutCourseNames.push(tutCourse.name);
                    }
                }

                toBeReturned.push({
                    label: `${user.fullName} (${["Elternteil", ...tutCourseNames].join(
                        ", ",
                    )})`,
                    value: `user:${user._id.toHexString()}`,
                });
            } else {
                // just a default case if some mistakes happen
                toBeReturned.push({
                    label: `${user.fullName}`,
                    value: `user:${user._id.toHexString()}`,
                });
            }
        }

        // now also check if the query could match a tut course
        // this could be the case if the query matches a tut course's name
        // or if the query matches
        // Schüler in <tut course name or course name>
        // Lehrer in <tut course name or course name>
        // Eltern in <tut course name or course name>

        // if the query starts with
        // Schüler in
        // Lehrer in or
        // Eltern in
        // then cut off the first part and look for courses and tut courses

        const courseNameToSearchFor = query.startsWith("Schüler in ")
            ? query.slice(11)
            : query.startsWith("Lehrer in ")
            ? query.slice(10)
            : query.startsWith("Eltern in ")
            ? query.slice(10)
            : query;

        const [tutCourseMatches] = await TutCourse.searchTutCourseByName(
            courseNameToSearchFor,
            0,
            5,
        );
        const [courseMatches] = await Course.searchCourseByName(
            courseNameToSearchFor,
            0,
            5,
        );

        if (tutCourseMatches && tutCourseMatches.length > 0) {
            if (query.startsWith("Schüler in")) {
                toBeReturned.push({
                    label: `Schüler in ${tutCourseMatches[0].name}`,
                    value: `students_in_tut:${tutCourseMatches[0]._id.toHexString()}`,
                });
            } else if (query.startsWith("Lehrer in")) {
                toBeReturned.push({
                    label: `Lehrer in ${tutCourseMatches[0].name}`,
                    value: `teachers_in_tut:${tutCourseMatches[0]._id.toHexString()}`,
                });
            } else if (query.startsWith("Eltern in")) {
                toBeReturned.push({
                    label: `Eltern in ${tutCourseMatches[0].name}`,
                    value: `parents_in_tut:${tutCourseMatches[0]._id.toHexString()}`,
                });
            } else {
                // if nothing specified, return all 3 options
                toBeReturned.push({
                    label: `Schüler in ${tutCourseMatches[0].name}`,
                    value: `students_in_tut:${tutCourseMatches[0]._id.toHexString()}`,
                });
                toBeReturned.push({
                    label: `Lehrer in ${tutCourseMatches[0].name}`,
                    value: `teachers_in_tut:${tutCourseMatches[0]._id.toHexString()}`,
                });
                toBeReturned.push({
                    label: `Eltern in ${tutCourseMatches[0].name}`,
                    value: `parents_in_tut:${tutCourseMatches[0]._id.toHexString()}`,
                });
            }
        }

        if (courseMatches && courseMatches.length > 0) {
            if (query.startsWith("Schüler in")) {
                toBeReturned.push({
                    label: `Schüler in ${courseMatches[0].name}`,
                    value: `students_in_course:${courseMatches[0]._id.toHexString()}`,
                });
            } else if (query.startsWith("Lehrer in")) {
                toBeReturned.push({
                    label: `Lehrer in ${courseMatches[0].name}`,
                    value: `teachers_in_course:${courseMatches[0]._id.toHexString()}`,
                });
            } else if (query.startsWith("Eltern in")) {
                toBeReturned.push({
                    label: `Eltern in ${courseMatches[0].name}`,
                    value: `parents_in_course:${courseMatches[0]._id.toHexString()}`,
                });
            } else {
                // if nothing specified, return all 3 options
                toBeReturned.push({
                    label: `Schüler in ${courseMatches[0].name}`,
                    value: `students_in_course:${courseMatches[0]._id.toHexString()}`,
                });
                toBeReturned.push({
                    label: `Lehrer in ${courseMatches[0].name}`,
                    value: `teachers_in_course:${courseMatches[0]._id.toHexString()}`,
                });
                toBeReturned.push({
                    label: `Eltern in ${courseMatches[0].name}`,
                    value: `parents_in_course:${courseMatches[0]._id.toHexString()}`,
                });
            }
        }

        return [toBeReturned, null];
    }
}

export default ASMSQ;
export { ASMSQResponseTypes, ParsedASMSQResult };
