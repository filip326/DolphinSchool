import PasswordlessQR from "../../../Dolphin/Passwordless/PasswordlessQR";

export default defineEventHandler(async (event) => {
    // check authentication
    const checkAuthResult = await event.context.auth.checkAuth(event, {});
    if (!checkAuthResult.success || !checkAuthResult.user) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }
    // get user object
    const user = checkAuthResult.user;

    const [qrLoginData, error] = await PasswordlessQR.requestChallenge();

    if (error || !qrLoginData) {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
        });
    }

    return {
        username: user.username,
        rp: useRuntimeConfig().public.DOMAIN,
        token: qrLoginData.token,
        url: qrLoginData.url,
        challenge: qrLoginData.challenge,
    };
});
