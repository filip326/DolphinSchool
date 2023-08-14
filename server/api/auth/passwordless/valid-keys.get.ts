import checkAuth from "@/server/composables/checkAuth";


export default defineEventHandler(async (event) => {

    const [user, authError] = await checkAuth(event);

    if (authError) {
        throw createError({
            statusCode: 401,
            message: authError.message,
        });
    }

    if (!user.webAuthNCredentials) {
        // not set up
        return [];
    }

    const keys = Object.keys(user.webAuthNCredentials).map(key => (user.webAuthNCredentials![key]?.credential.id ?? undefined)).filter(value => value !== undefined) as string[];

    return keys;

});
