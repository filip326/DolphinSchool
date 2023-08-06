
export default defineEventHandler(async (event) => {

    // return true, if the server expects a second factor of authentication (2FA)
    // return false, if the server does not expect a second factor of authentication (2FA) or the user is not authenticated

    // check authentication
    if (!event.context.auth.authenticated || !event.context.auth.user) {
        return "Login required";
    }

    // check if user needs 2fa
    if (event.context.auth.mfa_required && event.context.auth.user.mfaEnabled) {
        return "2fa required";
    }

    if (event.context.auth.mfa_required && !event.context.auth.user.mfaEnabled) {
        return "2fa not set up";
    }

    return "2fa not required";


});