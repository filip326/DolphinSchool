<script setup>
definePageMeta({
    layout: "login"
});
</script>

<script>
export default {
    data() {
        return {
            code: "",
            totpSec: "",
            rules: {
                required: (v) => !!v || "Dieses Feld ist erforderlich!"
            },
            userInfo: {
                fullName: "" | undefined,
                username: "" | undefined,
                is2faRequired: false,
                is2faSetup: false,
            },
            error: {
                shown: false,
                message: ""
            }
        };
    },
    methods: {
        async submit2FA() {
            const res = await useFetch("2fa-totp", {
                method: "POST",
                body: JSON.stringify({
                    totp: this.code
                })
            });

            if (res.error.value?.statusCode != 200) {
                this.error = {
                    shown: true,
                    message: "Ungültiger TOTP-Code!"
                };
            } else {
                await this.updateUser();
            }
        },
        async updateUser() {
            const res = await checkAuthAndReturnUserOrNull({
                throwErrorOnFailure: false
            });

            if (res) {
                this.userInfo = res;
            } else {
                this.error = {
                    shown: true,
                    message: "Sie sind nicht eingeloggt!"
                };
            }
        },
        async totpSecret() {
            const res = await useFetch("/api/setup/2fa/secret", {
                method: "GET"
            });

            if (res.status.value != "success")
                throw createError({
                    statusCode: res.error.value?.statusCode,
                    message: res.error.value?.message,
                    statusMessage: "Fehler beim Abrufen des TOTP-Secrets!"
                });

            if (!res.data.value)
                throw createError({
                    statusCode: 500,
                    statusMessage: "Fehler beim Abrufen des TOTP-Secrets!"
                });

            console.log(res.data.value);
            return res.data.value.secret ?? "";
        }
    },
    async mounted() {
        await this.updateUser();
        this.totpSec = await this.totpSecret();
    },
};
</script>

<template>
    <VForm id="loginform">
        <VAlert v-if="error.shown" type="error" variant="text" :text="error.message" />
        <img src="/img/School/DolphinSchool_light.png" alt="Dolphin School" />
        <h1>2-Faktor Authentizierung</h1>
        <p>
            Bitte scannen Sie den QR-Code mit einer Authenticator-App Ihrer Wahl und geben Sie den
            Code ein, um die 2-Faktor Authentizierung zu aktivieren.
        </p>

        <div class="qr-code">
            <!-- todo -->
            <img :src="`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/DolphinSchool?secret=${totpSec}`" />
        </div>

        <VTextField v-model="code" label="Code" name="code" type="text" :rules="[rules.required]" />

        <VBtn type="submit" color="primary" class="mr-4">2FA-Aktivieren</VBtn>
    </VForm>
</template>

<style scoped>
@import url(../../assets/login.css);
</style>
