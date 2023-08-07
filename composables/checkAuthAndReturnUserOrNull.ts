type CheckAuthResult =
    "/totp" | "/" |
    { username: string, fullName: string } |
    "failed";

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

        if (loginStatus.data.value === "2fa required") {
            return "/totp";
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

        return "failed";
    }

    return {
        fullName: whoamiResponse.data.value?.fullName,
        username: whoamiResponse.data.value?.username,
        type: whoamiResponse.data.value?.type,
        is2faRequired: totpResponse.data.value == "2fa required",
        is2faSetup: totpResponse.data.value == "2fa not set up"
    };
}
