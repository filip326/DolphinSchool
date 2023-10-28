<script lang="ts">
export default {
    data() {},
    async beforeCreate() {
        await checkAuth({
            redirectOnMfaRequired: true,
            throwErrorOnNotAuthenticated: true,
            redirectOnPwdChange: true,
        });
    },
};
</script>

<template>
    <EMailList title="Posteingang" url="/api/mail/inbox" />
</template>

<style scoped>
.floating_action_button {
    position: fixed;
    bottom: 20px;
    right: 20px;
}
</style>
