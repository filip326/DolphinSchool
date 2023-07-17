
// returns all avaible modules for the current user,
// that should be displayed in the dashboard
export default eventHandler(async (event) => {

    if (!event.context.auth.authenticated || event.context.auth.mfa_required || !event.context.auth.user) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    return [
        {
            name: "Kommunikation",
            icon: "mdi-chat",
            url: "/mail",
        }
    ]

});