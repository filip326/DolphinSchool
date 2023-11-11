type CheckAuthResult = {
    authenticated: boolean;
    mfa_required?: boolean;
    password_change_required?: boolean;
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
    redirectOnPwdChange?: boolean;
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
            if (whoamiRes.data.value.change_password_required) {
                if (options.redirectOnPwdChange) {
                    await navigateTo("/setup/chpwd");
                    return {
                        authenticated: false,
                        password_change_required: true,
                        user: {},
                    };
                }

                return {
                    authenticated: false,
                    password_change_required: true,
                    user: {
                        username: whoamiRes.data.value?.user?.username,
                        full_name: whoamiRes.data.value?.user?.full_name,
                        type: whoamiRes.data.value?.user?.type,
                        mfa_enabled: whoamiRes.data.value?.user?.mfa_enabled,
                    },
                };
            }

            // check if there is a push notification subsription already
            // if so, send the endpoint url to the server to prevent the subscription from expiring
            // do the check each session, once per day if the session is longer than 1 day
            if (
                sessionStorage.getItem("pushNotificationsLastSynced") == undefined ||
                Date.now() -
                    parseInt(sessionStorage.getItem("pushNotificationsLastSynced")!) >
                    24 * 60 * 60 * 1000
            ) {
                // 1 day
                if ("serviceWorker" in navigator) {
                    // check compatibility
                    navigator.serviceWorker.ready
                        .then((registration) => {
                            if (!("pushManager" in registration)) return; // check if push manager is available
                            registration.pushManager
                                .getSubscription()
                                .then(async (subscription) => {
                                    if (!subscription) return; // check if there is a subscription
                                    // get the subscription data
                                    const p256dhArraybuffer =
                                        subscription.getKey("p256dh");
                                    const authArraybuffer = subscription.getKey("auth");
                                    if (!p256dhArraybuffer || !authArraybuffer) return; // check if the subscription has the needed keys (p256dh and auth
                                    const p256dhBytes = new Uint8Array(p256dhArraybuffer);
                                    const authBytes = new Uint8Array(authArraybuffer);
                                    let p256dhBinaryString = "";
                                    let authBinaryString = "";
                                    p256dhBytes.forEach((byte) => {
                                        p256dhBinaryString += String.fromCharCode(byte);
                                    });
                                    authBytes.forEach((byte) => {
                                        authBinaryString += String.fromCharCode(byte);
                                    });
                                    const p256dhString = btoa(p256dhBinaryString);
                                    const authString = btoa(authBinaryString);

                                    await useFetch("/api/api/pushservice/update", {
                                        method: "POST",
                                        body: {
                                            endpoint: subscription.toJSON().endpoint,
                                            keys: {
                                                p256dh: p256dhString,
                                                auth: authString,
                                            },
                                        },
                                    });
                                })
                                .catch(() => {});
                        })
                        .catch(() => {});
                    // ignore errors, since this is not critical, but just a update to the server that needs to be done only all 30 days.
                }
                // update the last synced time in the session storage
                sessionStorage.setItem(
                    "pushNotificationsLastSynced",
                    Date.now().toString(),
                );
            }

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
