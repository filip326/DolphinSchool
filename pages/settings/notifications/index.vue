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
                    name: "Push-Benachrichtigungen",
                    link: "/settings/notifications/push",
                },
                {
                    name: "E-Mail Benachrichtigungen",
                    link: "/settings/notifications/mail",
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

<style scoped></style>
