export default eventHandler(async (event) => {
    return {
        authenticated: event.context.auth.authenticated,
        mfa_required: event.context.auth.mfa_required,
        user: {
            username: event.context.auth.user?.username,
            full_name: event.context.auth.user?.fullName,
            type: event.context.auth.user?.type,
            mfa_enabled: event.context.auth.user?.mfaEnabled
        },
    };
});