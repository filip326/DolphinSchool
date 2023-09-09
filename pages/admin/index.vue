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
                name: "Blockierte Passwörter",
                link: "/admin/blocked-pwds",
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
</template>

<style scoped>
@import url("../../assets/settings.css");
</style>
