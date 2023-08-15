<script setup>
import { client as pwless } from "@passwordless-id/webauthn";
definePageMeta({
    title: "passwordless",
    layout: "default"
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
                credId: credentials.credential.id
            }));

            // send credentials to server
            const response = await useFetch("/api/auth/passwordless/setup", {
                method: "post",
                body: JSON.stringify(
                    {
                        challenge: credentials,
                        token: this.token
                    }
                )
            });

            if (response.status.value !== "success") {
                navigateTo("/passwordless/not-avaible");
                return;
            }

            // redirect to dashboard
            navigateTo("/passwordless/setup-success");

        }
    },
    async beforeMount() {
        await checkAuth();

        if (!pwless.isAvailable()) {
            navigateTo("/passwordless/not-avaible");
            return;
        }

        if (!pwless.isLocalAuthenticator()) {
            navigateTo("/passwordless/not-avaible");
            return;
        }

        const response = await useFetch("/api/auth/passwordless/setup", { method: "GET" });
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
    }
};
</script>

<template>
    <VCard>
        <VCardTitle>
            passwordless Login
        </VCardTitle>
        <VCardSubtitle>
            passwordless Login einrichten
        </VCardSubtitle>
        <VCardText>
            <p>
                Mit passwordless Login können Sie sich auf diesem Gerät ohne Passwort anmelden. Zusätzlich können Sie sich
                auf anderen Geräten durch scannen des QR-Codes anmelden. Aktivieren Sie diese Funktion nur, wenn Sie
                eine sichere Bildschirmsperre eingerichtet haben.
            </p>
            <VForm @submit.prevent="setupPasswordless()">
                <VCheckbox label="Dies ist mein eigenes, privates Gerät" />
                <VCheckbox
                    label="Ich habe auf diesem Gerät eine sichere Bildschirmsperre (PIN, Passwort, Fingerabdruck oder Gesichtserkennung) eingerichtet" />
                <VBtn type="submit" :loading="loading">
                    Einrichten
                </VBtn>
                <VBtn type="button">
                    Überspringen
                </VBtn>
            </VForm>
        </VCardText>
    </VCard>
</template>