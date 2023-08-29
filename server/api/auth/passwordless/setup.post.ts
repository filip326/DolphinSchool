import PasswordlessQR from "../../../Dolphin/Passwordless/PasswordlessQR";

export default defineEventHandler(async (event) => {
    // check authentication
    const checkAuthResult = await event.context.auth.checkAuth(event, {});
    if (!checkAuthResult.success || !checkAuthResult.user) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }
    // get user object
    const user = checkAuthResult.user;

    // get signed challenge and token
    const { token, challenge } = await readBody(event);

    // register user
    const [success, error] = await PasswordlessQR.register(user, token, challenge);

    if (error || !success) {
        throw createError({
            statusCode: 400,
            message: "Bad Request",
        });
    }

    return "Ok";
});
