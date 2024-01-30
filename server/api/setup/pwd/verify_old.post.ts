export default defineEventHandler(async (event) => {
    // check auth
    const { success, user, statusCode } = await event.context.auth.checkAuth();
    if (!success) {
        throw createError({
            statusCode,
            message: "You are not logged in.",
        });
    }

    // check body for old password
    const { oldPassword } = await readBody(event);
    if (!oldPassword || typeof oldPassword !== "string") {
        throw createError({
            statusCode: 400,
            message: "Old password is required.",
        });
    }

    // check old password
    const [passwordCompare, passwordCompareError] =
        await user.comparePassword(oldPassword);
    if (passwordCompareError) {
        throw createError({
            statusCode: 500,
            message: "Server error",
        });
    }

    if (passwordCompare) {
        return {
            passwordValid: true,
        };
    }

    return {
        passwordValid: false,
    };
});
