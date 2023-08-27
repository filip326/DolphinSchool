import PasswordlessQR from "../../../Dolphin/Passwordless/PasswordlessQR";


export default defineEventHandler(async (event) => {
    if (
        !event.context.auth.authenticated ||
        event.context.auth.mfa_required ||
        !event.context.auth.user
    ) {
        throw createError({ statusCode: 401, message: "Unauthorized", });
    }

    const [qrLoginData, error,] = await PasswordlessQR.requestChallenge();

    if (error || !qrLoginData) {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
        });
    }

    return {
        username: event.context.auth.user.username,
        rp: useRuntimeConfig().public.DOMAIN,
        token: qrLoginData.token,
        url: qrLoginData.url,
        challenge: qrLoginData.challenge,
    };

});