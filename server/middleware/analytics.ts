import GlobalAnalyticsManager from "../Dolphin/Analytics/GlobalAnalyticsManager";
import Dolphin from "../Dolphin/Dolphin";

export default defineEventHandler(async (event) => {
    try {
        if (!Dolphin.instance) {
            await Dolphin.init(useRuntimeConfig());
        }
        await GlobalAnalyticsManager.addRequest(event);
        event.node.res.addListener("close", () => {
            // todo get stop time and save
        });
    } catch (err) {
        console.log(err);
    }
});
