<template>todo</template>

<script>
export default {
    async beforeCreate() {
        const checkAuthResult = await checkAuth({
            redirectOnMfaRequired: true,
            redirectOnPwdChange: true,
            throwErrorOnNotAuthenticated: true,
        });

        if (checkAuthResult.user.type !== "teacher") {
            throw createError({ statusCode: 403, statusMessage: "Forbidden" });
        }
    },
};
</script>

<style></style>
