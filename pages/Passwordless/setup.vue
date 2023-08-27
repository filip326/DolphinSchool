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
            debug_log: "",
            loading: true,
            challenge: "",
            username: "",
            token: "",
        };
    },
    methods: {
        async setupPasswordless() {

            this.loading = true;

            // check if passwordless is available
            if (!pwless.isAvailable()) {
                navigateTo("/passwordless/not-avaible");
                return;
            }
            if (!pwless.isLocalAuthenticator()) {
                navigateTo("/passwordless/not-avaible");
                return;
            }

            if (!this.challenge) {
                navigateTo("/passwordless/not-avaible");
                return;
            }

            // create new credential
            const credentials = await pwless.register(this.username, this.challenge);

            localStorage.setItem("passwordless", JSON.stringify({
                username: this.username,
                credId: credentials.credential.id,
            }));

            // send credentials to server
            const response = await useFetch("/api/auth/passwordless/setup", {
                method: "post",
                body: JSON.stringify(
                    {
                        challenge: credentials,
                        token: this.token,
                    }
                ),
            });

            if (response.status.value !== "success") {
                navigateTo("/passwordless/not-avaible");
                return;
            }

            // redirect to dashboard
            navigateTo("/passwordless/setup-success");

        },
    },
    async beforeMount() {
        await checkAuth({
            redirectOnMfaRequired: true,
            throwErrorOnNotAuthenticated: true,
        });

        if (!pwless.isAvailable()) {
            navigateTo("/passwordless/not-avaible");
            return;
        }

        if (!pwless.isLocalAuthenticator()) {
            navigateTo("/passwordless/not-avaible");
            return;
        }

        const response = await useFetch("/api/auth/passwordless/setup", { method: "GET", });
        if (response.status.value !== "success") {
            navigateTo("/passwordless/not-avaible");
            return;
        }

        this.token = response.data.value.token;
        this.challenge = response.data.value.challenge;
        this.username = response.data.value.username;

        if (!this.challenge || !this.token || !this.username) {
            navigateTo("/passwordless/not-avaible");
            return;
        }

        this.loading = false;
    },
};
</script>

<template>
    <div class="loginform">
        <div>
            <h1>passwordless Login </h1>
            <p>
                Mit passwordless Login können Sie sich auf diesem Gerät ohne Passwort anmelden. Zusätzlich können Sie
                sich auf anderen Geräten durch scannen des QR-Codes sehr einfach und sicher anmelden. Aktivieren Sie diese
                Funktion nur, wenn Sie eine sichere Bildschirmsperre eingerichtet haben.
            </p>
            <p>
                <b>Wichtig:</b> Falls Sie sich entscheiden das Passwort zu deaktivieren, können Sie sich nur noch anmelden,
                indem Sie mit diesem Gerät den QR-Code scannen. Auf diesem Gerät bleiben Sie angemeldet. Benutzen Sie diese
                Option <u>nur</u>, wenn es sich um Ihr Smartphone handelt.
            </p>

        </div>
        <VForm @submit.prevent="setupPasswordless()">
            <h1>Einrichten:</h1>
            <VCheckbox label="Dies ist mein eigenes, privates Gerät" />
            <VCheckbox
                label="Ich habe auf diesem Gerät eine sichere Bildschirmsperre (PIN, Passwort, Fingerabdruck oder Gesichtserkennung) eingerichtet" />
            <VCheckbox
                label="Die Anmeldung mit Passwort nach der Einrichtung deaktivieren. Dadurch kann ich mich nur noch anmelden, in dem ich mit diesem Gerät den QR-Code scanne. Dies erhöht die Kontosicherheit erheblich." />
            <VBtn type="submit" :loading="loading" color="primary">
                Einrichten
            </VBtn>
            <VBtn type="button">
                Überspringen
            </VBtn>
        </VForm>
    </div>
</template>

<style scoped></style>