import { Permissions } from "~/server/Dolphin/Permissions/PermissionManager";
import PasswordlessQR from "../../../Dolphin/Passwordless/PasswordlessQR";
import User from "../../../Dolphin/User/User";

export default defineEventHandler(async (event) => {
    // get signed string from body
    const { signed, tokenHash, username } = await readBody(event);

    if (!signed || !tokenHash || !username) {
        return createError({
            statusCode: 400,
            statusMessage: "Bad Request",
        });
    }

    const [user, userFindError] = await User.getUserByUsername(username);

    if (userFindError) {
        return createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
        });
    }

    if (!user) {
        return createError({
            statusCode: 404,
            statusMessage: "Not Found",
        });
    }

    if (!user.hasPermission(Permissions.GLOBAL_LOGIN)) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    // verify signed string
    const [approveResult, approveError] = await PasswordlessQR.approve(
        user,
        tokenHash,
        signed,
    );
    if (approveError) {
        return createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
        });
    }

    if (!approveResult) {
        return createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    return "Ok";
});
