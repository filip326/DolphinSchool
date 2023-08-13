import checkAuth from "@/server/composables/checkAuth";
import PasswordlessQR from "../../../Dolphin/Passwordless/PasswordlessQR";

export default defineEventHandler(async (event) => {

    // check authentication
    const [ user, authError ] = await checkAuth(event);

    if (authError || !user) {
        return createError({
            statusCode: 401,
            statusMessage: "Unauthorized"
        });
    }

    // get signed string from body
    const { signed, tokenHash } = await readBody(event);

    if (!signed) {
        return createError({
            statusCode: 400,
            statusMessage: "Bad Request"
        });
    }

    // verify signed string
    const [ approveResult, approveError ] = await PasswordlessQR.approve(user, tokenHash, signed);
    if (approveError) {
        return createError({
            statusCode: 500,
            statusMessage: "Internal Server Error"
        });
    }

    if (!approveResult) {
        return createError({
            statusCode: 401,
            statusMessage: "Unauthorized"
        });
    }
    

});