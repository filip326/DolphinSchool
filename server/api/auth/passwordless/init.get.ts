import PasswordlessQR from "../../../Dolphin/Passwordless/PasswordlessQR";


export default defineEventHandler(async () => {
    
    const [qrLoginData, error ] = await PasswordlessQR.requestChallenge();

    if (error || !qrLoginData) {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error"
        });
    }

    return {
        token: qrLoginData.token,
        url: qrLoginData.url,
        challenge: qrLoginData.challenge,
        tokenHash: qrLoginData.tokenSHA256
    };

});