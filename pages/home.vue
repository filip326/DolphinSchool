<script>
import { client as pwless } from "@passwordless-id/webauthn";
export default {
    data() {
        return {
            passwordless_setup: false,
            apps: [
                {
                    title: "Mail",
                    links: [
                        {
                            href: "/mail",
                            text: "Übersicht",
                        },
                        {
                            href: "/mail/write",
                            text: "Neue Mail",
                        },
                    ],
                },
                {
                    title: "Kurs-und Klassensystem",
                    links: [
                        {
                            href: "/classes",
                            text: "Übersicht",
                        },
                    ],
                },
                {
                    title: "Einstellungen",
                    links: [
                        {
                            href: "/settings",
                            text: "Übersicht",
                        },
                        {
                            href: "/settings/security/totp/setup",
                            text: "2FA",
                        },
                        {
                            href: "/settings/security/chpwd",
                            text: "Passwort ändern",
                        },
                    ],
                },
            ],
        };
    },
    async beforeCreate() {
        await checkAuth({
            redirectOnMfaRequired: true,
            throwErrorOnNotAuthenticated: true,
            redirectOnPwdChange: true,
        });
    },
    async beforeMount() {
        this.passwordless_setup =
            window.localStorage.getItem("passwordless") != null ||
            !pwless.isAvailable() ||
            !pwless.isLocalAuthenticator();
    },
};
</script>

<template>
    <VCard density="compact" v-if="!passwordless_setup">
        <VCardTitle> passwordless Login </VCardTitle>
        <VCardSubtitle> passwordless Login auf diesem Gerät einrichten? </VCardSubtitle>
        <VCardText>
            Richten Sie auf diesem Gerät passwordless Login ein, um sich noch einfacher
            anzumelden!
        </VCardText>
        <VCardActions>
            <VBtn
                @click="navigateTo('/passwordless/setup')"
                variant="elevated"
                color="primary"
            >
                Jetzt Einrichten
            </VBtn>
            <VBtn @click="passwordless_setup = true" variant="text"> Jetzt nicht </VBtn>
        </VCardActions>
    </VCard>
    <h1>Home</h1>
    <div class="settings__wrapper">
        <MenuThreeLinksCard
            v-for="app in apps"
            :key="app.title"
            :title="app.title"
            :links="app.links"
        />
    </div>
</template>

<style scoped>
.settings__wrapper {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 500px));
    gap: 10px;
}
</style>
