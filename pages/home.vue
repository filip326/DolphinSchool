<script setup>
import { client as pwless } from "@passwordless-id/webauthn";
</script>

<script>
export default {
    data() {
        return {
            passwordless_setup: false,
        };
    },
    async beforeMount() {
        await checkAuth({
            redirectOnMfaRequired: true,
            throwErrorOnNotAuthenticated: true
        });
        this.passwordless_setup = window.localStorage.getItem("passwordless") != null || !pwless.isAvailable() || !pwless.isLocalAuthenticator();
    }
};
</script>

<template>
    <VCard density="compact" v-if="!passwordless_setup">
        <VCardTitle>
            passwordless Login
        </VCardTitle>
        <VCardSubtitle>
            passwordless Login auf diesem Gerät einrichten?
        </VCardSubtitle>
        <VCardText>
            Richten Sie auf diesem Gerät passwordless Login ein, um sich noch einfacher anzumelden!
        </VCardText>
        <VCardActions>
            <VBtn @click="navigateTo('/passwordless/setup')" variant="elevated" color="primary">
                Jetzt Einrichten
            </VBtn>
            <VBtn @click="passwordless_setup = true" variant="text">
                Jetzt nicht
            </VBtn>
        </VCardActions>
    </VCard>
    <h1>Home</h1>
</template>

<style scoped></style>
