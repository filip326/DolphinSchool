<template>
    <div class="loginform small">
        <VForm @submit.prevent>
            <VAlert v-if="error.shown" type="error" variant="text" :text="error.message" />

            <h1>2-Faktor Authentizierung</h1>
            <p>
                Geben Sie bitte den 6-stelligen Code aus Ihrer Authentizierungs-App (z.B. Authy) von Ihrem Smartphone
                ein.
            </p>
            <!--
            TODO: #12 make text field a otp field when released in vuetify
        -->
            <VTextField
                type="text"
                label="2FA-Code"
                v-model="totp"
                placeholder="12345678"
                hint="Geben Sie hier den Code ein."
                :rules="[rules.required, rules.totpLength, rules.totpNumbers]"
            >
            </VTextField>

            <VBtn type="submit" size="large" variant="outlined">Einloggen</VBtn>
        </VForm>
    </div>
</template>

<script setup>
definePageMeta({
    layout: "login",
});
</script>

<script>
export default {
    data() {
        return {
            rules: {
                // required
                required: (v) => !!v || "Dieses Feld ist erforderlich",
                // 6 digits
                totpLength: (v) => v.length === 6 || "Der Code muss 6-stellig sein",
                // only numbers
                totpNumbers: (v) => /^\d+$/.test(v) || "Der Code darf nur aus Zahlen bestehen",
            },
            error: {
                shown: false,
                message: "",
            },
            totp: "",
        };
    },

    methods: {
        async login() {
            this.error.shown = false;
            this.error.message = "";

            const res = await useFetch("/api/2fa-totp", {
                method: "GET",
                body: JSON.stringify({
                    totp: this.totp,
                }),
            });

            if (res.status.value === "success") {
                navigateTo("/home");
            } else {
                this.error.shown = true;
                this.error.message = "Der Code ist ungültig";
            }
        },
    },
    async beforeMount() {
        const auth = await checkAuth({
            redirectOnMfaRequired: false,
            throwErrorOnNotAuthenticated: true,
        });
        if (auth.authenticated && !auth.mfa_required) {
            navigateTo("/home");
        }
    },
};
</script>

<style scoped>
@import url("../assets/login.css");
</style>
