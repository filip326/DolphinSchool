import GlobalAnalyticsManager from "../Dolphin/Analytics/GlobalAnalyticsManager";
import Dolphin from "../Dolphin/Dolphin";
import FSLogger from "../FSLogger/FSLogger";

export default defineEventHandler(async (event) => {
    try {
        if (!Dolphin.instance) {
            await Dolphin.init(useRuntimeConfig());
        }
        await GlobalAnalyticsManager.addRequest(event);
    } catch (err) {
        console.log(err);
        FSLogger.log(
            "analytics",
            "ERROR",
            "Failed to add request to analytics" + JSON.stringify(err)
        );
    }
});
