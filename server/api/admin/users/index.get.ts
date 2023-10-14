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

    let searchResult;

    if (typeof query.s !== "string" || query.s.length < 1) {
        searchResult = await User.listUsers({});
    } else {
        console.log("Searching for users with name: " + query.s);
        searchResult = await User.searchUsersByName(query.s);
    }

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

    return {
        users,
        count: users.length,
    };
});
