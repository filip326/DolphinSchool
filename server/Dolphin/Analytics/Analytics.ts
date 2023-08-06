import { UserType } from "../User/UserTypes";

interface IAnalytics {
    date: string;
    globalUserCount: number;
    globalRequestCount: number;
    details: {
        userCountByType: {
            [key in UserType]: number;
        };
    };
}

export default IAnalytics;
