import { Db, Collection } from "mongodb";
import Dolphin from "../Dolphin";
import IAnalytics from "./Analytics";

export default class GlobalAnalyticsManager {
    private readonly analyticsCollection: Collection<IAnalytics>;

    private static instance: GlobalAnalyticsManager;

    private constructor(db: Db) {
        this.analyticsCollection = db.collection<IAnalytics>("analytics");
    }

    public static getInstance(dolphin: Dolphin): GlobalAnalyticsManager {
        if (GlobalAnalyticsManager.instance) {
            return GlobalAnalyticsManager.instance;
        }

        GlobalAnalyticsManager.instance = new GlobalAnalyticsManager(dolphin.database);
        return GlobalAnalyticsManager.instance;
    }
}
