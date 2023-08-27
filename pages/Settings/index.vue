<script lang="ts">
export default {
    async beforeMount() {
        await checkAuth({
            redirectOnMfaRequired: true,
            throwErrorOnNotAuthenticated: true,
        });
    },
    data() {
        return {
            settings: Array<{ name: string; link: string }>(
                {
                    name: "Persönliche Einstellungen",
                    link: "/settings/profile",
                },
                {
                    name: "Sicherheit",
                    link: "/settings/security",
                }
            ),
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
.settings__wrapper {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 500px));
    gap: 10px;
}

.v-icon {
    margin: 12px;
}
</style>
