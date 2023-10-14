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
            }, {
                name: "Benutzer verwalten",
                link: "/admin/users",
            }),
        };
    },
};
</script>

<template>
    <h2><VIcon>mdi-security</VIcon>Administrator Tools</h2>
    <div class="settings__wrapper">
        <MenuOneLinkCard
            v-for="(setting, index) in settings"
            v-bind:key="index"
            :title="setting.name"
            :href="setting.link"
        />
    </div>
</template>

<style scoped></style>
