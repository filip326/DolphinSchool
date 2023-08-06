
export default defineEventHandler(async (event) => {

    // return true, if the server expects a second factor of authentication (2FA)
    // return false, if the server does not expect a second factor of authentication (2FA) or the user is not authenticated

    // check authentication
    if (!event.context.auth.authenticated) {
        return false;
    }

    // check if user needs 2fa
    return event.context.auth.mfa_required;


});