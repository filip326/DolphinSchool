import { UserType } from "../User/UserTypes";

export default interface IAnalytics {
    date: string;
    globalUserCount: number;
    globalRequestCount: number;
    details: {
        userCountByType: {
            [key in UserType]: number;
        };
    }
}
