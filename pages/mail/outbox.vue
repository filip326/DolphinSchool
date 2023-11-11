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
    <EMailList title="Postausgang" url="/api/mail/outbox" />
</template>

<style scoped>
.floating_action_button {
    position: fixed;
    bottom: 20px;
    right: 20px;
}
</style>
