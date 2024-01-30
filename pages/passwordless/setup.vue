<script setup>
import { client as pwless } from "@passwordless-id/webauthn";
definePageMeta({
    title: "passwordless",
    layout: "login",
});
</script>

<script>
export default {
    data() {
        return {
            formState: "info",
            debug_log: "",
            loading: true,
            challenge: "",
            username: "",
            token: "",
        };
    },
    methods: {
        async setupPasswordless() {
            this.formState = "setting-up";

            // check if passwordless is available
            if (!pwless.isAvailable()) {
                this.formState = "not-available";
                return;
            }
            if (!pwless.isLocalAuthenticator()) {
                this.formState = "not-available";
                return;
            }

            if (!this.challenge) {
                this.formState = "not-available";
                return;
            }

            // create new credential
            const credentials = await pwless.register(this.username, this.challenge);

            localStorage.setItem(
                "passwordless",
                JSON.stringify({
                    username: this.username,
                    credId: credentials.credential.id,
                }),
            );

            // send credentials to server
            const response = await useFetch("/api/auth/passwordless/setup", {
                method: "post",
                body: JSON.stringify({
                    challenge: credentials,
                    token: this.token,
                }),
            });

            if (response.status.value !== "success") {
                this.formState = "not-available";
                return;
            }

            // redirect to dashboard
            this.formState = "done";
        },
    },
    async beforeCreate() {
        await checkAuth({
            redirectOnMfaRequired: true,
            throwErrorOnNotAuthenticated: true,
            redirectOnPwdChange: true,
        });
    },
    async beforeMount() {
        if (!pwless.isAvailable()) {
            this.formState = "not-available";
            return;
        }

        if (!pwless.isLocalAuthenticator()) {
            this.formState = "not-available";
            return;
        }

        const response = await useFetch("/api/auth/passwordless/setup", {
            method: "GET",
        });
        if (response.status.value !== "success") {
            this.formState = "not-available";
            return;
        }

        this.token = response.data.value.token;
        this.challenge = response.data.value.challenge;
        this.username = response.data.value.username;

        if (!this.challenge || !this.token || !this.username) {
            this.formState = "not-available";
            return;
        }

        this.loading = false;
    },
};
</script>

<template>
    <div class="loginform small">
        <VCard>
            <VWindow
                v-model="formState"
                :touch="{
                    start() {},
                    end() {},
                    left() {},
                    right() {},
                    down() {},
                    up() {},
                    move() {},
                }"
            >
                <VWindowItem value="info">
                    <VCardTitle>Passwordless Login</VCardTitle>
                    <VCardText>
                        Durch die Verwendung von Passwordless Login können Sie sich ohne
                        ihr Passwort auf diesem und andren Geräten anmelden. Nach der
                        Einrichtung können Sie sich nur durch das Scannen eines QR-Codes
                        mit ihrer Kamera anmelden.
                        <VBtn
                            color="primary"
                            @click="setupPasswordless"
                            append-icon="mdi-chevron-right"
                            >Einrichten</VBtn
                        >
                        <VBtn
                            color="text"
                            to="/home"
                            class="left-button"
                            prepend-icon="mdi-chevron-left"
                            >Zurück zur Startseite</VBtn
                        >
                    </VCardText>
                </VWindowItem>
                <VWindowItem value="setting-up">
                    <VCardTitle>Passwordless Login</VCardTitle>
                    <VCardText>
                        Die Einrichtung von Passwordless hat begonnen. Bitte folgen Sie
                        den Anweisungen Ihres Browsers/Betriebssystems.
                        <VProgressCircular indeterminate color="primary" />
                    </VCardText>
                </VWindowItem>
                <VWindowItem value="done">
                    <VCardTitle>Passwordless Login</VCardTitle>
                    <VCardText>
                        Die Einrichtung von Passwordless war erfolgreich. Sie können sich
                        nun mit Ihrem Smartphone anmelden. Nutzen Sie dafür den Button
                        "PasswordlessQR" oder "Als {{ username }} anmelden" auf der
                        Login-Maske.
                        <VBtn
                            color="text"
                            to="/home"
                            class="left-button"
                            prepend-icon="mdi-chevron-left"
                            >Zurück zur Startseite</VBtn
                        >
                    </VCardText>
                </VWindowItem>
                <VWindowItem value="not-available">
                    <VCardTitle>Passwordless Login</VCardTitle>
                    <VCardText>
                        Passwordless ist auf diesem Gerät leider nicht verfügbar.
                        <VBtn
                            color="text"
                            to="/home"
                            class="left-button"
                            prepend-icon="mdi-chevron-left"
                            >Zurück zur Startseite</VBtn
                        >
                    </VCardText>
                </VWindowItem>
            </VWindow>
        </VCard>
    </div>
</template>

<style scoped></style>
