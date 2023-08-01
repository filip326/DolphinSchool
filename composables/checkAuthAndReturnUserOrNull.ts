export default async function checkAuthAndReturnUserOrNull(options: {
    throwErrorOnFailure?: boolean;
}) {
    const response = await useFetch("/api/whoami")

    // todo return null, if statusCode is not 200
    if (response.error.value?.statusCode !== 200) {
        if (options.throwErrorOnFailure) {
            throw createError({
                statusCode: response.error.value?.statusCode,
                message: response.error.value?.message,
            })
        } else {
            return null
        }
    }

    return response.data.value
}
