import GlobalCourseManager from "../Course/GlobalCourseManager";
import GlobalSubjectManager from "../Course/GlobalSubjectManager";
import GlobalUserManager from "../User/GlobalUserManager";
import ASMSQInterpreter, { ASMSQResult } from "./AdvancedSyntaxObject";
import Course from "../Course/Course";
import User from "../User/User";
import SearchUserOptions from "../User/SearchUserOptions";
import type SearchCourseOptions from "../Course/SearchCourseOptions";
import Dolphin from "../Dolphin";

export default class ASMSQ {
    asmsq: string;
    userManager: GlobalUserManager;
    courseManager: GlobalCourseManager;
    subjectManager: GlobalSubjectManager;

    result: unknown | null = null;
    parsedResult: ASMSQResult[];

    constructor(asmsq: string, dolphin: Dolphin) {
        this.asmsq = asmsq;
        this.userManager = GlobalUserManager.getInstance(dolphin);
        this.courseManager = GlobalCourseManager.getInstance(dolphin);
        this.subjectManager = GlobalSubjectManager.getInstance(dolphin);
        this.parsedResult = new ASMSQInterpreter(asmsq).result;
        this.process();
    }

    private async process(): Promise<void> {
    // todo process the asmsq with the Managers and create an array of users and courses that match the asmsq
    // todo then set the result to the array

        // eslint-disable-next-line prefer-const
        let output: [User[], Course[]] = [[], []];

        for (let i = 0; i < this.parsedResult.length; i++) {
            const query = this.parsedResult[i];

            const users = await this.userManager.searchUsers(query as SearchUserOptions);
            if (!users[0] || users[1] != null) continue;
            output[0].concat(users[0]);


            const courses = await this.courseManager.searchCourses(query as SearchCourseOptions);
            if (!courses[0] || courses[1] != null) continue;
            output[1].concat(courses[0]);
        }

        this.result = null;
    }
}
