import ASMSQ from "~/server/Dolphin/ASMSQ/ASMSQ";
import { Permissions } from "~/server/Dolphin/Permissions/PermissionManager";

export default eventHandler(async (event) => {
    const checkAuthResult = await event.context.auth.checkAuth();

    if (!checkAuthResult.success || !checkAuthResult.user) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    const query = getQuery(event).s;
    if (!query) {
        throw createError({ statusCode: 400, message: "Bad Request" });
    }

    const [result, error] = await ASMSQ.suggest(
        query.toString(),
        checkAuthResult.user.hasPermission(Permissions.ASMSQ_HERO),
    );

    if (error) {
        throw createError({ statusCode: 404, message: "Not Found" });
    }

    return result;
});
