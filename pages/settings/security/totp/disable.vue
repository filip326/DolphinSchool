<template>
    <div class="settings_form">
        <section class="settings_info">
            <div>
                <h1>2FA</h1>
                <ol>
                    <li>
                        Ihr Konto hat 2-Faktor-Authentizierung (2FA), die die Sicherheit
                        Ihres Kontos erheblich erhöht.
                    </li>
                    <li>
                        Dies schützt Ihr Konto vor Cyberangriffen und erfordert den Code
                        von Ihrem Smartphone für den Zugriff.
                    </li>
                    <li>
                        Falls Sie die 2-Faktor-Authentizierung deaktivieren möchten,
                        müssen Sie Ihr Passwort und einen 2FA-Code eingeben.
                    </li>
                </ol>
            </div>
        </section>

        <VForm @submit.prevent="submit2FA()">
            <VAlert
                v-if="error.shown"
                type="error"
                variant="text"
                :text="error.message"
            />

            <VTextField
                v-model="password"
                label="Passwort"
                name="password"
                type="password"
                :rules="[rules.required]"
            />
            <VOtpInput
                length="6"
                focus-all
                v-model="code"
                label="Code"
                name="code"
                type="text"
                :rules="[rules.required, rules.totpLength, rules.totpNumbers]"
            />

            <VBtn type="submit" color="primary" class="mr-4">2FA Deaktivieren</VBtn>
        </VForm>
    </div>
</template>

<script lang="ts">
export default {
    data() {
        return {
            code: "",
            password: "",
            rules: {
                required: (v: any) => !!v || "Dieses Feld ist erforderlich!",
                totpLength: (v: any) => v.length === 6 || "Der Code muss 6-stellig sein!",
                totpNumbers: (v: any) =>
                    /^\d+$/.test(v) || "Der Code darf nur aus Zahlen bestehen!",
            },
            error: {
                shown: false,
                message: "",
            },
        };
    },
    methods: {
        async submit2FA() {
            const res = await useFetch("/api/setup/2fa/disable", {
                method: "POST",
                body: JSON.stringify({
                    password: this.password,
                    totp: this.code,
                }),
            });

            if (res.status.value !== "success" || res.data.value !== "Ok") {
                this.error = {
                    shown: true,
                    message: " Versuchen Sie es bitte erneut.",
                };
                return;
            }

            navigateTo("/home");
        },
    },
    async beforeCreate() {
        const checkAuthRes = await checkAuth({
            redirectOnMfaRequired: true,
            throwErrorOnNotAuthenticated: true,
            redirectOnPwdChange: true,
        });

        if (!checkAuthRes.user.mfa_enabled) {
            await navigateTo("/settings/security/totp/setup");
            return;
        }
    },
};
</script>

<style scoped>
.settings_form {
    padding: 20px;
}
</style>
