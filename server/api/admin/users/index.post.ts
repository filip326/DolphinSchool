import { Permissions } from "~/server/Dolphin/PermissionsAndRoles/PermissionManager";
import User from "~/server/Dolphin/User/User";

export default eventHandler(async (event) => {
    const { fullName, type, username } = await readBody(event);

    if (type == "student" || type == "parent") {
        const checkAuthResult = await event.context.auth.checkAuth({
            PermissionLevel: Permissions.CREATE_STUDENT_OR_PARENT,
        });
        if (!checkAuthResult.success || !checkAuthResult.user) {
            throw createError({
                statusCode: checkAuthResult.statusCode,
                message: "Failed",
            });
        }
    } else if (type == "teacher") {
        const checkAuthResult = await event.context.auth.checkAuth({
            PermissionLevel: Permissions.CREATE_TEACHER,
        });
        if (!checkAuthResult.success || !checkAuthResult.user) {
            throw createError({
                statusCode: checkAuthResult.statusCode,
                message: "Failed",
            });
        }
    } else {
        throw createError({ statusCode: 400, message: "Invalid type" });
    }

    if (!fullName || !type || !username) {
        throw createError({ statusCode: 400, message: "Missing required fields" });
    }

    const user = await User.createUser({
        fullName,
        type,
        username,
    });

    if (user[0] || !user[1]) {
        return {
            pwd: user[0].password,
            username: user[0].username,
        };
    } else {
        throw createError({ statusCode: 500, message: "Failed to create user" });
    }
});
