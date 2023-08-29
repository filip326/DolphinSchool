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
    const whoamiRes = await useFetch("/api/auth/whoami");

    if (whoamiRes.status.value != "success") {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal server error",
            fatal: true,
        });
    }
    if (whoamiRes.data.value?.mfa_required) {
        if (options.redirectOnMfaRequired) {
            await navigateTo("/totp");
            return {
                authenticated: false,
                mfa_required: true,
                user: {},
            };
        }

        return {
            authenticated: false,
            mfa_required: true,
            user: {
                username: whoamiRes.data.value?.user?.username,
                full_name: whoamiRes.data.value?.user?.full_name,
                type: whoamiRes.data.value?.user?.type,
                mfa_enabled: whoamiRes.data.value?.user?.mfa_enabled,
            },
        };
    } else {
        if (whoamiRes.data.value?.authenticated) {
            return {
                authenticated: true,
                user: {
                    username: whoamiRes.data.value?.user?.username,
                    full_name: whoamiRes.data.value?.user?.full_name,
                    type: whoamiRes.data.value?.user?.type,
                    mfa_enabled: whoamiRes.data.value?.user?.mfa_enabled,
                },
            };
        } else {
            if (options.throwErrorOnNotAuthenticated) {
                throw createError({
                    statusCode: 401,
                    statusMessage: "Unauthorized",
                    fatal: true,
                });
            }

            return {
                authenticated: false,
                mfa_required: false,
                user: {},
            };
        }
    }
}
