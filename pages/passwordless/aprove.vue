<script setup>
import { client as pwless } from "@passwordless-id/webauthn";

definePageMeta({
    title: "passwordless",
    layout: "non",
});
</script>

<script>
export default {
    data() {
        return {
            error: false,
            error_message: "",
            continue_button: {
                loading: false,
            },
            passwordlessData: {
                username: "",
                token: "",
                challenge: "",
                keys: [],
            },
        };
    },
    methods: {
        async approve() {
            this.continue_button.loading = true;

            if (
                !this.passwordlessData.token ||
                !this.passwordlessData.username ||
                !this.passwordlessData.challenge ||
                !this.passwordlessData.keys ||
                !pwless.isAvailable() ||
                !pwless.isLocalAuthenticator()
            ) {
                this.continue_button.loading = false;
                console.error("passwordless checks failed");
                navigateTo("/passwordless/not-avaible");
                return;
            }

            try {
                const authentication = await pwless.authenticate(
                    this.passwordlessData.keys,
                    this.passwordlessData.challenge,
                    {
                        timeout: 60_000,
                        userVerification: "required",
                        authenticatorType: "local",
                    },
                );

                const response2 = await useFetch("/api/auth/passwordless/approve", {
                    method: "POST",
                    body: JSON.stringify({
                        username: this.passwordlessData.username,
                        tokenHash: this.passwordlessData.token,
                        signed: authentication,
                    }),
                });

                if (response2.status.value !== "success") {
                    this.continue_button.loading = false;
                    navigateTo("/passwordless/not-avaible");
                    return;
                }

                if (response2.data.value === "Ok") {
                    navigateTo("/passwordless/done");
                } else {
                    this.continue_button.loading = false;
                    navigateTo("/passwordless/not-avaible");
                    return;
                }
            } catch (err) {
                this.continue_button.loading = false;
                console.log("passwordless failed");
                console.error(err);
                navigateTo("/passwordless/not-avaible");
                return;
            }
        },
    },
    async beforeMount() {
        this.continue_button.loading = true;

        if (!pwless.isAvailable() || !pwless.isLocalAuthenticator()) {
            this.continue_button.loading = false;
            navigateTo("/passwordless/not-avaible");
            this.error = true;
            this.error_message = "passwordless checks failed";
            return;
        }

        const data = JSON.parse(localStorage.getItem("passwordless"));

        if (!data.username || !data.credId) {
            this.continue_button.loading = false;
            navigateTo("/passwordless/not-avaible");
            return;
        }

        this.passwordlessData.username = data.username;
        this.passwordlessData.keys = [data.credId];

        if (!this.passwordlessData.keys || this.passwordlessData.keys.length === 0) {
            this.continue_button.loading = false;
            navigateTo("/passwordless/not-avaible");
            return;
        }

        // url param "challenge" is the challenge
        const challenge = this.$route.query.challenge;
        if (!challenge) {
            this.continue_button.loading = false;
            navigateTo("/passwordless/not-avaible");
            return;
        }

        this.passwordlessData.challenge = challenge;

        const token = this.$route.query.token;

        if (!token) {
            this.continue_button.loading = false;
            navigateTo("/passwordless/not-avaible");
            return;
        }

        this.passwordlessData.token = token;

        this.continue_button.loading = false;
    },
};
</script>

<template>
    <VCard>
        <VCardTitle>passwordless Login</VCardTitle>

        <VCardText>
            <VAlert v-if="error" type="error" :text="error_message" />
            <ul>
                <li>
                    Prüfen Sie die URL in der Adresszeile des Browsers. Loggen Sie sich
                    <u>nicht</u> ein, wenn Sie sich nicht sicher sind, dass Sie auf der
                    offiziellen Website von DolphinSchool sind.
                </li>
                <li>Drücken Sie nun auf den Button weiter unten.</li>
                <li>Sie werden automatisch angemeldet.</li>
            </ul>
        </VCardText>

        <VCardActions>
            <VSpacer />
            <VBtn color="secondary" @click="approve" :loading="continue_button.loading"
                >Anmeldung bestätigen</VBtn
            >
        </VCardActions>
    </VCard>
</template>
