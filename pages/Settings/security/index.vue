<script lang="ts">
export default {
    async beforeMount() {
        await checkAuth({
            redirectOnMfaRequired: true,
            throwErrorOnNotAuthenticated: true
        });
    },
    data() {
        return {
            settings: Array<{name: string; link: string;}>(
                {
                    name: "Passwort ändern",
                    link: "/settings/security/change-password"
                },
                {
                    name: "2FA",
                    link: "/settings/security/mfa"
                },
                {
                    name: "Passwordless",
                    link: "/settings/security/passwordless"
                }
            )
        };
    }
};
</script>

<template>
    <h2><VIcon>mdi-cogs</VIcon>Sicherheit</h2>
    <div class="settings__wrapper">
        <VCard v-for="(setting, index) in settings" :key="index">
            <VCardTitle>
                {{ setting.name }}
            </VCardTitle>
            <VCardActions>
                <VSpacer />
                <VBtn prepend-icon="mdi-open-in-new" variant="outlined">Aufrufen</VBtn>
            </VCardActions>
        </VCard>
    </div>
</template>

<style scoped>
.settings__wrapper {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 500px));
    gap: 10px;
}

.v-icon {
    margin: 12px;
}
</style>
