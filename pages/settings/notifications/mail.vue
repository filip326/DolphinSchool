<script lang="ts">
export default {
    async beforeCreate() {
        await checkAuth({
            redirectOnMfaRequired: true,
            redirectOnPwdChange: true,
            throwErrorOnNotAuthenticated: true,
        });
    },
    data() {
        return {
            error: {
                show: false,
                message: "",
            },
        };
    },
    async beforeMount() {},
};
</script>

<template>
    <VCard>
        <VCardTitle>E-Mail Benachrichtigungen</VCardTitle>
        <VCardText> E-Mail Benachrichtigungen sind noch nicht verfügbar. </VCardText>
    </VCard>
</template>

<style scoped>
.check-result {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 20px;
    text-align: center;
}
</style>
