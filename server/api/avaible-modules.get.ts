// returns all avaible modules for the current user,
// that should be displayed in the dashboard
export default eventHandler(async (event) => {
    const checkAuthResult = await event.context.auth.checkAuth(event, {});
    if (!checkAuthResult.success || !checkAuthResult.user) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    return [
        {
            name: "Kommunikation",
            icon: "mdi-chat",
            url: "/mail",
        },
    ];
});
