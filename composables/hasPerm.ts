export enum Permissions {
    GLOBAL_LOGIN = 1 << 0,
    CREATE_COURSE = 1 << 1,
    MANAGE_BLOCKED_PWDS = 1 << 2,
}

export default async function hasPerm(perm: Permissions): Promise<boolean> {
    const hasPermRes = await useFetch(`/api/permissions/${perm}`);

    if (hasPermRes.status.value != "success" || hasPermRes.data.value == null) {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal server error",
            fatal: true,
        });
    }

    return hasPermRes.data.value;
}
