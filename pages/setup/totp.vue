<script setup lang="ts">
definePageMeta({
    layout: "login"
});
</script>

<script lang="ts">
import { ref } from "vue";

export default {
    data() {
        return {
            code: "",
            rules: {
                required: (v: string) => !!v || "Dieses Feld ist erforderlich!"
            },
            userInfo: ref<{
                fullName: string | undefined;
                username: string | undefined;
                type: string | undefined;
                is2faRequired: boolean;
                is2faSetup: boolean;
            }>(),
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
                throwErrorOnFailure: true
            });

            if (res) {
                this.userInfo = res;
            } else {
                this.error = {
                    shown: true,
                    message: "Sie sind nicht eingeloggt!"
                };
            }
        }
    },
    async mounted() {
        this.updateUser();
    },
    computed: {
        async totpSecret() {
            const res = await useFetch("/setup/2fa/secret", {
                method: "GET"
            });

            if (res.error.value?.statusCode != 200) throw createError({
                statusCode: res.error.value?.statusCode,
                message: res.error.value?.message,
                statusMessage: "Fehler beim Abrufen des TOTP-Secrets!"
            });

            if (!res.data.value) throw createError({
                statusCode: 500,
                statusMessage: "Fehler beim Abrufen des TOTP-Secrets!"
            });

            return res.data.value;
        }
    }
};
</script>

<template>
    <VForm v-if="!userInfo?.is2faSetup" id="loginform">
        <VAlert v-if="error.shown" type="error" variant="text" :text="error.message" />

        <img src="/img/School/DolphinSchool_light.png" alt="Dolphin School" />
        <h1>2-Faktor Authentizierung</h1>
        <p>
            Bitte scannen Sie den QR-Code mit einer Authenticator-App Ihrer Wahl und geben Sie den
            Code ein, um die 2-Faktor Authentizierung zu aktivieren.
        </p>

        <div class="qr-code">
            <QRCodeDisplay :color="'#000'" :bg-color="'#fff'" :size="100" :text="`otpauth://totp/DolphinSchool?secret=${totpSecret}`" />
        </div>

        <VTextField v-model="code" label="Code" name="code" type="text" :rules="[rules.required]" />

        <VBtn type="submit" color="primary" class="mr-4">2FA-Aktivieren</VBtn>
    </VForm>

    <VCard v-if="userInfo?.is2faSetup" id="loginform">
        <VAlert v-if="error.shown" type="error" variant="text" :text="error.message" />

        <img src="/img/School/DolphinSchool_light.png" alt="Dolphin School" />
        <h1>2-Faktor Authentizierung</h1>
        <strong>
            2-Faktor Authentizierung ist bereits aktiviert!
        </strong>
    </VCard>
</template>
