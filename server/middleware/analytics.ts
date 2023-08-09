import GlobalAnalyticsManager from "../Dolphin/Analytics/GlobalAnalyticsManager";
import FSLogger from "../FSLogger/FSLogger";

export default defineEventHandler(async (event) => {
    try {
        await GlobalAnalyticsManager.addRequest(event);
    } catch (err) {
        FSLogger.log(
            "analytics",
            "ERROR",
            "Failed to add request to analytics" + JSON.stringify(err)
        );
    }
});
