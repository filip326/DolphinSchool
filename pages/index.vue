<script lang="ts">
import QRCode from "qrcode";
import { client as pwless } from "@passwordless-id/webauthn";

definePageMeta({
    layout: "login",
});
export default {
    data() {
        return {
            username: "" as string,
            pwd: "" as string,
            error: {
                shown: false,
                message: "",
            },
            passwordless: {
                avaible: false,
                localAvaible: false,
                localUser: "",
                token: "",
                tokenHash: "",
                challenge: "",
                qr_url: "",
                qr_code: "",
                interval: undefined as NodeJS.Timeout | undefined,
            },
        };
    },
    async beforeCreate() {
        const auth = await checkAuth({
            redirectOnMfaRequired: true,
            throwErrorOnNotAuthenticated: false,
            redirectOnPwdChange: true,
        });
        if (auth.authenticated && !auth.mfa_required) {
            navigateTo("/home");
        }
    },
    async beforeMount() {
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

                    this.username = "";
                    this.pwd = "";
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

            QRCode.toDataURL(response.data.value.url, (err, dataUrl) => {
                if (err) {
                    this.passwordless.avaible = false;
                    return;
                }
                this.passwordless.avaible = true;
                this.passwordless.qr_code = dataUrl;
            });
            this.passwordless.token = response.data.value.token ?? "";
            this.passwordless.tokenHash = response.data.value.tokenHash ?? "";

            this.passwordless.interval = setInterval(() => {
                this.checkPasswordless();
            }, 3_000);
            const data = JSON.parse(localStorage.getItem("passwordless") ?? "");

            if (!data || !data.username || !data.credId) {
                return;
            }

            if (!pwless.isAvailable() || !pwless.isLocalAuthenticator()) {
                return;
            }
            this.passwordless.localAvaible = true;
            this.passwordless.localUser = data.username;
        },
        async singnInusingLocalPasswordless() {
            const data = JSON.parse(localStorage.getItem("passwordless") ?? "");
            if (!data || !data.username || !data.credId) {
                return;
            }
            if (!pwless.isAvailable() || !pwless.isLocalAuthenticator()) {
                return;
            }
            const signed = await pwless.authenticate(
                [data.credId],
                this.passwordless.challenge,
                {
                    userVerification: "required",
                },
            );

            await useFetch("/api/auth/passwordless/approve", {
                method: "POST",
                body: JSON.stringify({
                    username: data.username,
                    tokenHash: this.passwordless.tokenHash,
                    signed: signed,
                }),
            });
        },
        async checkPasswordless() {
            if (this.passwordless.avaible === false) {
                return;
            }

            const response = await useFetch("/api/auth/passwordless/login", {
                method: "POST",
                body: JSON.stringify({ token: this.passwordless.token }),
            });

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
    <VDialog
        v-model="error.shown"
        @click:outside="error.shown = false"
        @key.down.esc="error.shown = false"
    >
        <VCard>
            <VCardTitle class="headline">Fehler</VCardTitle>
            <VCardText>{{ error.message }}</VCardText>
            <VCardActions>
                <VBtn color="primary" @click="error.shown = false">Schließen</VBtn>
            </VCardActions>
        </VCard>
    </VDialog>
    <div class="loginform">
        <VForm @submit.prevent="login">
            <h1>Login</h1>
            <VBtn
                v-if="passwordless.localAvaible"
                variant="outlined"
                prepend-icon="mdi-key"
                >Als {{ passwordless.localUser }} anmelden.</VBtn
            >
            <div v-if="passwordless.localAvaible" class="hr-sect">ODER</div>
            <VSpacer v-if="passwordless.localAvaible" />
            <VTextField
                label="Benutzername"
                v-model="username"
                placeholder="max.mustermann"
                hint="Ihr Benutzername besteht aus Ihrem Vor- und Nachnamen, durch einen Punkt getrennt."
            ></VTextField>
            <VTextField
                label="Passwort"
                v-model="pwd"
                type="password"
                placeholder="P@55w0rt"
                hint="Geben Sie hier Ihr Passwort ein."
            ></VTextField>
            <VBtn type="submit" size="large" variant="outlined">Einloggen</VBtn>
            <NuxtLink to="/support">Ich kann mich nicht einloggen</NuxtLink>
        </VForm>
        <div class="only-on-pc">
            <h1>passwordless</h1>
            <VAlert
                v-if="passwordless.avaible"
                type="info"
                variant="text"
                text="passwordless funktioniert nur, wenn Sie es zuvor eingerichtet haben!"
            />
            <VAler
                v-else
                type="error"
                variant="text"
                text="passwordless ist nicht verfügbar!"
            />
            <p v-if="passwordless.avaible">
                Scanne den QR Code mit der Kamera deines Smartphones und folge den
                Anweisungen auf dem Bildschirm.
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

.hr-sect {
    display: flex;
    flex-basis: 100%;
    align-items: center;
    color: rgb(var(--v-theme-on-surface));
    margin: 8px 0px;
}

.hr-sect:before,
.hr-sect:after {
    content: "";
    flex-grow: 1;
    background: rgb(var(--v-theme-on-surface));
    height: 1px;
    font-size: 0px;
    line-height: 0px;
    margin: 0px 8px;
}
</style>
