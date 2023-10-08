import { Permissions } from "~/server/Dolphin/Permissions/PermissionManager";
import User from "~/server/Dolphin/User/User";

export default eventHandler(async (event) => {
    const checkAuthResult = await event.context.auth.checkAuth({
        PermissionLevel: Permissions.VIEW_ALL_USERS,
    });
    if (!checkAuthResult.success || !checkAuthResult.user) {
        throw createError({ statusCode: checkAuthResult.statusCode, message: "Failed" });
    }

    const query = getQuery(event);

    if (!query.s) throw createError({ statusCode: 400, message: "Missing query" });

    const searchResult = await User.searchUsers({
        nameQuery: query.s.toString(),
        class: query.s.toString(),
    });

    if (!searchResult[0] || searchResult[1]) {
        throw createError({ statusCode: 404, message: "Not found" });
    }

    const users = searchResult[0].map((user) => {
        return {
            id: user._id,
            name: user.fullName,
            type: user.type as "student" | "teacher" | "parent",
            tutName: undefined,
        };
    });

    return users;
});
