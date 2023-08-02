import { Db, Collection } from "mongodb";
import Dolphin from "../Dolphin";
import IAnalytics from "./Analytics";
import MethodResult from "../MethodResult";
import IGetAnalyticsOptions from "./IGetAnalyticsOptions";

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

  public async getAnalytics(options: IGetAnalyticsOptions): Promise<MethodResult<IAnalytics>> {
    try {
      // create a query object to find the analytics by date (if provided) or by date range (if provided)
      const query: any = {};
      if (options.date) {
        query.date = options.date;
      } else if (options.from && options.to) {
        query.date = {
          $gte: options.from,
          $lte: options.to
        };
      }
      const analytics = await this.analyticsCollection.findOne(query);
      if (!analytics) {
        return [undefined, new Error("Analytics not found")];
      }

      return [analytics, null];
    } catch (error) {
      return [undefined, new Error("Failed to get analytics")];
    }
  }
}
