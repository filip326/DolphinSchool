import PasswordlessQR from "../../../Dolphin/Passwordless/PasswordlessQR";
import checkAuth from "../../../composables/checkAuth";


export default defineEventHandler(async (event) => {

    // get auth
    const [ user, authError ] = await checkAuth(event);

    if (authError) {
        throw createError({
            statusCode: 401,
            message: "Unauthorized"
        });
    }

    // get signed challenge and token
    const { token, challenge } = await readBody(event);

    // register user
    const [ success, error ] = await PasswordlessQR.register(user, token, challenge);

    if (error || !success) {
        throw createError({
            statusCode: 400,
            message: "Bad Request"
        });
    }

    return "Ok";

});