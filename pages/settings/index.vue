<script lang="ts">
export default {
    async beforeCreate() {
        await checkAuth({
            redirectOnMfaRequired: true,
            throwErrorOnNotAuthenticated: true,
            redirectOnPwdChange: true,
        });
    },
    data() {
        return {
            settings: Array<{ name: string; link: string }>({
                name: "Sicherheit",
                link: "/settings/security",
            }),
        };
    },
};
</script>

<template>
    <h2><VIcon>mdi-cogs</VIcon>Einstellungen</h2>
    <div class="settings__wrapper">
        <MenuOneLinkCard
            v-for="(setting, index) in settings"
            v-bind:key="index"
            :title="setting.name"
            :href="setting.link"
        />
    </div>
    <VCard v-for="(setting, index) in settings" :key="index">
        <VCardTitle>
            {{ setting.name }}
        </VCardTitle>
        <VCardActions>
            <VSpacer />
            <VBtn prepend-icon="mdi-open-in-new" variant="outlined"> Öffnen </VBtn>
        </VCardActions>
    </VCard>
</template>

<style scoped>
@import url("../../assets/settings.css");
</style>
