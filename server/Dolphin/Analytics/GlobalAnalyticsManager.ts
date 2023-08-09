import { H3Event } from "h3";
import Dolphin from "../Dolphin";
import { Collection, Document, ObjectId } from "mongodb";
import { UserType } from "../User/UserTypes";
import { IUser } from "../User/User";

interface IDailyAnalytics extends Document {
    timestamp: string;
    requests: number;
    userAmount: number;
    userAmountByType: Record<UserType, number>;
    sessionsAmount: number;
    // TODO: add msg amount of the day
}

interface IRequestAnalyics extends Document {
    timestamp: string;
    path: string;
    method: string;
    auth: boolean;
    userId?: ObjectId;
    // TODO: add more info (ip, user-agent, etc.)
}

export default class GlobalAnalyticsManager {
    static async addRequest(event: H3Event): Promise<void> {
        const collection = await GlobalAnalyticsManager.getCollection<IRequestAnalyics>(
            "requests",
            true
        );
        const doc: IRequestAnalyics = {
            timestamp: new Date().toISOString(),
            path: event.path,
            method: event.node.req.method ?? "unknown",
            auth: event.context.auth.authenticated ?? false,
            userId: event.context.auth.user?._id ?? undefined
        };
        await collection.insertOne(doc);
    }

    static async getRequestAmount(start: string, end: string): Promise<number> {
        const collection = await GlobalAnalyticsManager.getCollection<IRequestAnalyics>(
            "requests",
            true
        );
        // get the amount of requests between the start and end date
        const amount = await collection.countDocuments({
            timestamp: { $gte: start, $lte: end }
        });
        return amount;
    }

    static async getRequests(start: string, end: string): Promise<IRequestAnalyics[]> {
        const collection = await GlobalAnalyticsManager.getCollection<IRequestAnalyics>(
            "requests",
            true
        );
        // find the requests analytics between the start and end date
        const requests = await collection
            .find({
                timestamp: { $gte: start, $lte: end }
            })
            .toArray();
        return requests;
    }

    static async addDaylyAnalytics(): Promise<void> {
        const collection = await GlobalAnalyticsManager.getCollection<IDailyAnalytics>(
            "dayly",
            true
        );

        const userCollection = await GlobalAnalyticsManager.getCollection<IUser>("users", false);
        const userAmount = await userCollection.countDocuments();
        const parentAmount = await userCollection.countDocuments({ type: "parent" });
        const studentAmount = await userCollection.countDocuments({ type: "student" });
        const teacherAmount = await userCollection.countDocuments({ type: "teacher" });

        const sessionCollection = await GlobalAnalyticsManager.getCollection<IRequestAnalyics>(
            "sessions",
            true
        );
        const sessionsAmount = await sessionCollection.countDocuments();

        const doc: IDailyAnalytics = {
            timestamp: new Date().toISOString(),
            requests: await GlobalAnalyticsManager.getRequestAmount(
                new Date().toISOString(),
                new Date().toISOString()
            ),
            sessionsAmount: sessionsAmount,
            userAmount: userAmount,
            userAmountByType: {
                parent: parentAmount,
                student: studentAmount,
                teacher: teacherAmount
            }
        };
        await collection.insertOne(doc);
    }

    static async getDaylyAnalytics(start: string, end: string): Promise<IDailyAnalytics[]> {
        const collection = await GlobalAnalyticsManager.getCollection<IDailyAnalytics>(
            "dayly",
            true
        );
        // find the analytics between the start and end date
        const data = await collection
            .find({
                timestamp: { $gte: start, $lte: end }
            })
            .toArray();
        return data;
    }

    private static async getCollection<T extends Document>(
        subName: string,
        analyticsPrefix: boolean
    ): Promise<Collection<T>> {
        const dolphin = Dolphin.instance;
        if (!dolphin) throw new Error("Dolphin is not initialized");
        return dolphin.database.collection<T>(`${analyticsPrefix ? "analytics" : ""}-${subName}`);
    }
}
