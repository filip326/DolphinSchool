import User from "../Dolphin/User/User";

export default eventHandler(async (event) => {
    const user: User | undefined = event.context.auth.user;

    if (!user) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    if (!event.context.auth.authenticated) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    return {
        username: user.username,
        fullName: user.fullName,
        type: user.type,
    };
});
