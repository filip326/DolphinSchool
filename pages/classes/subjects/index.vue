<template>todo</template>

<script>
export default {
    async beforeCreate() {
        await checkAuth({
            redirectOnMfaRequired: true,
            redirectOnPwdChange: true,
            throwErrorOnNotAuthenticated: true,
        });
    },
};
</script>

<style></style>
