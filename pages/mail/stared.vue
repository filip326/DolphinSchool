<script lang="ts">
export default {
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
    <EMailList title="Markiert" url="/emails/get/stared" @email_selected="" />
</template>

<style scoped>
.floating_action_button {
    position: fixed;
    bottom: 20px;
    right: 20px;
}
</style>
