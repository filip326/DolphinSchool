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
            settings: [
                {
                    name: "Passwort ändern",
                    link: "/settings/security/chpwd",
                },
                {
                    name: "2FA",
                    link: "/settings/security/totp/setup",
                },
            ] as Array<{ name: string; link: string }>,
        };
    },
};
</script>

<template>
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
</style>
