import GlobalCourseManager from "Dolphin/Course/GlobalCourseManager";
import GlobalSubjectManager from "Dolphin/Course/GlobalSubjectManager";
import GlobalUserManager from "Dolphin/User/GlobalUserManager";
import { Db } from "mongodb";
import ASMSQInterpreter, { ASMSQResult } from "./AdvancedSyntaxObject";
import Course from "Dolphin/Course/Course";
import User from "Dolphin/User/User";
import SearchUserOptions from "Dolphin/User/SearchUserOptions";
import type SearchCourseOptions from "Dolphin/Course/SearchCourseOptions";

export default class ASMSQ {
    asmsq: string;
    userManager: GlobalUserManager;
    courseManager: GlobalCourseManager;
    subjectManager: GlobalSubjectManager;

    result: unknown | null = null;
    parsedResult: ASMSQResult[];

    constructor(asmsq: string, db: Db) {
        this.asmsq = asmsq;
        this.userManager = new GlobalUserManager(db);
        this.courseManager = new GlobalCourseManager(db);
        this.subjectManager = new GlobalSubjectManager(db);
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
