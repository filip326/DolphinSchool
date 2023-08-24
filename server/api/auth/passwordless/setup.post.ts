import PasswordlessQR from "../../../Dolphin/Passwordless/PasswordlessQR";


export default defineEventHandler(async (event) => {
    if (
        !event.context.auth.authenticated ||
        event.context.auth.mfa_required ||
        !event.context.auth.user
    ) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    // get signed challenge and token
    const { token, challenge } = await readBody(event);

    // register user
    const [ success, error ] = await PasswordlessQR.register(event.context.auth.user, token, challenge);

    if (error || !success) {
        throw createError({
            statusCode: 400,
            message: "Bad Request"
        });
    }

    return "Ok";

});