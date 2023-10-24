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
            settings: Array<{ name: string; link: string }>(
                {
                    name: "Blockierte Passwörter",
                    link: "/admin/blocked-pwds",
                },
                {
                    name: "Benutzer verwalten",
                    link: "/admin/users",
                },
                {
                    name: "Fächer verwalten",
                    link: "/admin/subjects",
                },
                {
                    name: "Kurse verwalten",
                    link: "/admin/courses",
                },
                {
                    name: "Klassen verwalten",
                    link: "/admin/tut-courses",
                },
            ),
        };
    },
};
</script>

<template>
    <h2><VIcon>mdi-security</VIcon>Administrator Tools</h2>
    <div class="__wrapper">
        <MenuOneLinkCard
            v-for="(setting, index) in settings"
            v-bind:key="index"
            :title="setting.name"
            :href="setting.link"
        />
    </div>
</template>

<style scoped>
.__wrapper {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 500px));
    gap: 10px;
}
</style>
