<template>
    <div class="loginform small">
        <VForm @submit.prevent="login">
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
                placeholder="123456"
                hint="Geben Sie hier den Code ein."
                :rules="[rules.required, rules.totpLength, rules.totpNumbers]"
            >
            </VTextField>

            <VBtn :loading="button.loading" type="submit" size="large" variant="outlined">Einloggen</VBtn>
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
            button: {
                loading: false,
            },
            totp: "",
        };
    },

    methods: {
        async login() {
            this.error.shown = false;
            this.error.message = "";

            this.button.loading = true;

            const res = await useFetch("/api/auth/2fa-totp", {
                method: "POST",
                body: JSON.stringify({
                    totp: this.totp,
                }),
            });

            this.button.loading = false;

            if (res.status.value === "success") {
                navigateTo("/home");
            } else {
                this.error.shown = true;
                this.error.message = "Der Code ist ungültig";
            }
        },
    },
    async beforeCreate() {
        const auth = await checkAuth({
            redirectOnMfaRequired: false,
            throwErrorOnNotAuthenticated: false,
            redirectOnPwdChange: true,
        });
        if (!auth.authenticated && !auth.mfa_required) {
            navigateTo("/");
        }
        if (auth.authenticated && !auth.mfa_required) {
            navigateTo("/home");
        }
    },
};
</script>

<style scoped>
@import url("../assets/login.css");
</style>
