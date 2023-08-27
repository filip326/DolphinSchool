type CheckAuthResult = {
    authenticated: boolean;
    mfa_required?: boolean;
    user: {
        username?: string;
        full_name?: string;
        type?: "student" | "teacher" | "parent";
        mfa_enabled?: boolean;
    };
};

export default async function checkAuth(options: {
    throwErrorOnNotAuthenticated?: boolean;
    redirectOnMfaRequired?: boolean;
}): Promise<CheckAuthResult> {
    const loginStatusRes = await useFetch("/api/auth/login-status");
    const whoamiRes = await useFetch("/api/auth/whoami");

    if (loginStatusRes.status.value != "success" || whoamiRes.status.value != "success") {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal server error",
            fatal: true,
        });
    }

    if (loginStatusRes.data.value?.statusCode != 200) {
        switch (loginStatusRes.data.value?.statusCode) {
            case 401:
                if (options.throwErrorOnNotAuthenticated) {
                    throw createError({
                        statusCode: 401,
                        statusMessage: "Not authenticated",
                        fatal: true,
                    });
                }
                return {
                    authenticated: false,
                    mfa_required: false,
                    user: {},
                };
            case 403:
                if (options.redirectOnMfaRequired) {
                    await navigateTo("/totp");
                }
                return {
                    authenticated: false,
                    mfa_required: true,
                    user: {},
                };
            default:
                throw createError({
                    statusCode: 500,
                    statusMessage: "Internal server error",
                    fatal: true,
                });
        }
    } else {
        if (whoamiRes.data.value?.authenticated) {
            return {
                authenticated: true,
                mfa_required: whoamiRes.data.value?.mfa_required,
                user: {
                    username: whoamiRes.data.value?.user?.username,
                    full_name: whoamiRes.data.value?.user?.full_name,
                    type: whoamiRes.data.value?.user?.type,
                    mfa_enabled: whoamiRes.data.value?.user?.mfa_enabled,
                },
            };
        } else {
            return {
                authenticated: false,
                mfa_required: false,
                user: {},
            };
        }
    }
}
