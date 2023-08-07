export default async function checkAuthAndReturnUserOrNull(options: {
    throwErrorOnFailure?: boolean;
}) {
    const whoamiResponse = await useFetch("/api/whoami");
    const totpResponse = await useFetch("/api/is-2fa-required");

    // todo return null, if statusCode is not 200
    if (whoamiResponse.error.value?.statusCode !== 200) {
        if (options.throwErrorOnFailure) {
            throw createError({
                statusCode: whoamiResponse.error.value?.statusCode,
                message: whoamiResponse.error.value?.message
            });
        } else {
            return null;
        }
    }

    // todo return null, if statusCode is not 200
    if (totpResponse.error.value?.statusCode !== 200) {
        if (options.throwErrorOnFailure) {
            throw createError({
                statusCode: totpResponse.error.value?.statusCode,
                message: totpResponse.error.value?.message
            });
        } else {
            return null;
        }
    }

    return {
        user: whoamiResponse.data.value,
        is2faRequired: totpResponse.data.value == "2fa required",
        is2faSetup: totpResponse.data.value == "2fa not set up"
    };
}
