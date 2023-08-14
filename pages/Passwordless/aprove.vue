<script setup>
import { client as pwless } from "@passwordless-id/webauthn";

definePageMeta({
    title: "passwordless",
    layout: "non"
});
</script>

<script>

export default {
    data() {
        return {
            continue_button: {
                loading: false,
            },
            passwordlessData: {
                token: "",
                challenge: "",
                keys: [],
            }
        };
    },
    methods: {
        async approve() {

            this.continue_button.loading = true;

            if (!this.passwordlessData.token
                || !this.passwordlessData.challenge
                || !this.passwordlessData.keys
                || !pwless.isAvailable()
                || !pwless.isLocalAuthenticator()) {
                this.continue_button.loading = false;
                navigateTo("/passwordless/not-avaible");
                return;
            }


            try {
                const authentication = await pwless.authenticate(keys, challenge, {
                    timeout: 60_000,
                    userVerification: "required",
                    authenticatorType: "local",
                });

                const response2 = await useFetch("/api/auth/passwordless/approve", {
                    method: "POST", body: JSON.stringify({
                        token,
                        signed: authentication
                    })
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



            } catch {
                this.continue_button.loading = false;
                navigateTo("/passwordless/not-avaible");
                return;
            }

        }
    },
    async beforeMount() {
        this.continue_button.loading = true;

        if (!pwless.isAvailable() || !pwless.isLocalAuthenticator()) {
            this.continue_button.loading = false;
            navigateTo("/passwordless/not-avaible");
            return;
        }

        const response = await useFetch("/api/auth/passwordless/valid-keys", { method: "get" });
        if (response.status.value !== "success") {
            this.continue_button.loading = false;
            navigateTo("/passwordless/not-avaible");
            return;
        }

        this.passwordlessData.keys = response.data.value;

        if (!keys || keys.length === 0) {
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
    }
};
</script>

<template>
    <VCard>
        <VCardTitle>passwordless Login</VCardTitle>

        <VCardText>
            <ul>
                <li>Prüfe die URL in der Adresszeile des Browsers. Logge dich <u>nicht</u> ein, wenn du dir nicht sicher
                    bist, dass du auf der offiziellen Website von DolphinSchool bist.</li>
                <li>Drücke nun auf den Button weiter.</li>
                <li>Du wirst automatisch angemeldet.</li>
            </ul>
        </VCardText>

        <VCardActions>
            <VSpacer />
            <VBtn color="secondary" @click="approve" :loading="continue_button.loading">Anmeldung bestätigen</VBtn>
        </VCardActions>

    </VCard>
</template>