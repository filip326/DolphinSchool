<script setup lang="ts">
import QRCode from "qrcode";
import { client as pwless } from "@passwordless-id/webauthn";

definePageMeta({
    layout: "login",
});
</script>

<script lang="ts">
export default {
    data() {
        return {
            username: "",
            pwd: "",
            error: {
                shown: false,
                message: "",
            },
            passwordless: {
                avaible: true,
                token: "",
                challenge: "",
                qr_url: "",
                qr_code: "",
                interval: ref<NodeJS.Timer | undefined>(undefined),
            },
        };
    },
    async beforeMount() {
        const auth = await checkAuth({
            redirectOnMfaRequired: true,
            throwErrorOnNotAuthenticated: false,
        });
        if (auth.authenticated && !auth.mfa_required) {
            navigateTo("/home");
        }
        await this.loadPasswordlessQRCode();
    },
    methods: {
        async login() {
            const response = await useFetch("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    username: this.username,
                    password: this.pwd,
                }),
            });

            if (response.status.value === "error") {
                this.error.shown = true;
                this.error.message = "Login fehlgeschlagen";
                return;
            }

            switch (response.data.value) {
                case "Login successful":
                    navigateTo("/home");
                    break;
                case "continue with 2fa":
                    navigateTo("/totp");
                    break;
                case "continue with 2fa setup":
                    navigateTo("/setup/totp");
                    break;
                default:
                    this.error.shown = true;
                    this.error.message = "Login fehlgeschlagen";
                    break;
            }
        },
        async loadPasswordlessQRCode() {
            const response = await useFetch("/api/auth/passwordless/init", {
                method: "GET",
            });

            if (response.status.value !== "success") {
                this.error.shown = true;
                this.error.message = "Fehler beim Laden des QR Codes";
                return;
            }

            if (!response.data.value?.url || !response.data.value?.token) {
                this.passwordless.avaible = false;
                return;
            }

            console.log(response.data.value.url);
            QRCode.toDataURL(response.data.value.url, (err, dataUrl) => {
                if (err) {
                    this.passwordless.avaible = false;
                    return;
                }
                this.passwordless.qr_code = dataUrl;
                this.passwordless.token = response.data.value?.token ?? "";
            });

            this.passwordless.interval = setInterval(() => {
                this.checkPasswordless();
            }, 3_000);

            try {
                const data = JSON.parse(localStorage.getItem("passwordless") ?? "");

                if (!data || !data.username || !data.credId) {
                    return;
                }

                if (!pwless.isAvailable() || !pwless.isLocalAuthenticator()) {
                    return;
                }

                const signed = await pwless.authenticate([ data.credId, ], response.data.value?.challenge, {
                    userVerification: "required",
                });

                await useFetch("/api/auth/passwordless/approve", {
                    method: "POST",
                    body: JSON.stringify({
                        username: data.username,
                        tokenHash: response.data.value?.tokenHash,
                        signed: signed,
                    }),
                });

            } catch {
                return;
            }
        },
        async checkPasswordless() {
            if (this.passwordless.avaible === false) {
                return;
            }

            const response = await useFetch("/api/auth/passwordless/login", { method: "POST", body: JSON.stringify({ token: this.passwordless.token, }), });

            if (response.status.value !== "success") {
                this.error.shown = true;
                this.error.message = "Fehler beim passwordless Login";
                clearInterval(this.passwordless.interval);
                return;
            }

            if (response.data.value === "waiting for aproval") {
                return;
            }

            if (response.data.value === "Login successful") {
                clearInterval(this.passwordless.interval);
                navigateTo("/home");
                return;
            }
        },

    },

    beforeUnmount() {
        clearInterval(this.passwordless.interval);
    },
};
</script>

<template>
    <div class="loginform">
        <VForm @submit.prevent="login">
            <VAlert v-if="error.shown" type="error" variant="text" :text="error.message" />
            <h1>Login</h1>
            <VTextField label="Benutzername" v-model="username" placeholder="max.mustermann"
                hint="Ihr Benutzername besteht aus Ihrem Vor- und Nachnamen, durch einen Punkt getrennt."></VTextField>
            <VTextField label="Passwort" v-model="pwd" type="password" placeholder="P@55w0rt"
                hint="Geben Sie hier Ihr Passwort ein."></VTextField>
            <VBtn type="submit" size="large" variant="outlined">Einloggen</VBtn>
            <NuxtLink to="/support">Ich kann mich nicht einloggen</NuxtLink>
        </VForm>
        <div>
            <h1>passwordless</h1>
            <VAlert v-if="passwordless.avaible" type="info" variant="text"
                text="passwordless funktioniert nur, wenn Sie es zuvor eingerichtet haben!" />
            <VAler v-else type="error" variant="text" text="passwordless ist nicht verfügbar!" />
            <p v-if="passwordless.avaible">
                Scanne den QR Code mit der Kamera deines Smartphones und folge den Anweisungen auf dem Bildschirm.
            </p>
            <!-- placeholder 128 x 128 px-->
            <VImg v-if="passwordless.avaible" :src="passwordless.qr_code" />
        </div>
    </div>
</template>

<style scoped>
@import url("../assets/login.css");

.v-img {
    width: 128px;
    height: 128px;
    margin: 10px auto;
}

.v-progress-circular {
    width: 200px;
    height: 200px;
}
</style>
