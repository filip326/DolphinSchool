import PasswordlessQR from "../../../Dolphin/Passwordless/PasswordlessQR";
import checkAuth from "../../../composables/checkAuth";


export default defineEventHandler(async (event) => {

    const [user, authError] = await checkAuth(event);
    if (authError) {
        throw createError({
            statusCode: 401,
            message: "Unauthorized"
        });
    }

    const [qrLoginData, error] = await PasswordlessQR.requestChallenge();

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error"
        });
    }

    return {
        username: user.username,
        rp: useRuntimeConfig().public.DOMAIN,
        token: qrLoginData.token,
        url: qrLoginData.url
    };

});