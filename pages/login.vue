<script lang="ts">
import { toDataURL } from "qrcode";
import { client as pwless } from "@passwordless-id/webauthn";

definePageMeta({
    layout: "login",
});

type PasswordlessQRData = {
    qrCodeContent: string;
    expires: number;
    loginToken: string;
    qrCodeImage: string;
};

export default {
    data(): {
        formState:
            | "start"
            | "loading"
            | "forgot_password"
            | "change_password"
            | "totp"
            | "passwordless"
            | "error";

        login: {
            username: string;
            password: string;
            buttonShake: boolean;
            otp: string;
            otpShake: boolean;
            otpLoading: boolean;
        };
        passwordlessQr: PasswordlessQRData[];
        passwordlessQRInterval?: NodeJS.Timeout;
        support: {
            description: string;
            fullName: string;
            tut: string;
            teacher: string;
            email: string;
        };
        rules: {
            required: (value: string) => boolean | string;
            email: (value: string) => boolean | string;
        };
    } {
        return {
            formState: "start",
            login: {
                username: "",
                password: "",
                buttonShake: false,
                otp: "",
                otpShake: false,
                otpLoading: false,
            },
            passwordlessQr: [],
            support: {
                description: "",
                fullName: "",
                tut: "",
                teacher: "",
                email: "",
            },
            rules: {
                required: (value: string) => !!value || "Erforderlich",
                email: (value: string) => /.+@.+/.test(value) || "Ungültige E-Mail",
            },
        };
    },

    methods: {
        loginButtonShake() {
            return new Promise<void>((resolve) => {
                this.login.buttonShake = true;
                setTimeout(() => {
                    this.login.buttonShake = false;
                    resolve();
                }, 500);
            });
        },
        async openPasswordless() {
            this.formState = "loading";
            console.log("openPasswordless");

            if (
                this.passwordlessQr.some((qr) => qr.expires > Date.now() + 1000 * 60 * 2) // valid for at least 2 minutes
            ) {
                // don't do anything still there is a valid qr code available
                this.formState = "passwordless";
                console.log("somewhat done");
                return;
            }

            console.log("requesting new qr code");

            // load new qr code
            const response = await useFetch("/api/auth/passwordless/init", {
                method: "get",
            });
            if (response.status.value === "success") {
                const data = response.data.value;
                if (!data) {
                    // TODO: error handling
                    console.error("no data");
                    return;
                }
                toDataURL(data.url, (err, url) => {
                    if (err) {
                        // TODO: error handling
                        console.error(err);
                        return;
                    }
                    this.passwordlessQr.push({
                        expires: data.expires,
                        loginToken: data.token,
                        qrCodeContent: data.url,
                        qrCodeImage: url,
                    });
                    this.formState = "passwordless";
                    console.log("done");
                });
            } else {
                return;
            }

            if (this.passwordlessQRInterval) {
                clearInterval(this.passwordlessQRInterval);
            }
            this.passwordlessQRInterval = setInterval(
                this.passwordlessTick,
                1000 * 20, // every 20 seconds
            );

            if (!pwless.isAvailable() || !pwless.isLocalAuthenticator()) {
                return;
            }
            const passwordlessLocalData = localStorage.getItem("passwordless");
            if (passwordlessLocalData) {
                const data = JSON.parse(passwordlessLocalData);
                if (data.username && data.credId) {
                    this.formState = "loading";
                    const result = await pwless.authenticate(
                        [data.credId],
                        response.data.value!.challenge,
                        {
                            userVerification: "required",
                        },
                    );
                    if (!result) {
                        return;
                    }
                    const aprovalResponse = await useFetch(
                        "/api/auth/passwordless/approve",
                        {
                            method: "post",
                            body: {
                                username: data.username,
                                tokenHash: response.data.value!.tokenHash,
                                signed: result,
                            },
                        },
                    );

                    if (aprovalResponse.status.value === "success") {
                        const loginResponse = await useFetch(
                            "/api/auth/passwordless/login",
                            {
                                method: "post",
                                body: {
                                    token: response.data.value!.token,
                                },
                            },
                        );
                        if (loginResponse.status.value === "success") {
                            if (loginResponse.data.value === "Login successful") {
                                navigateTo("/home");
                                return;
                            }
                        }
                    }
                    this.formState = "passwordless";
                }
            }
        },
        zurueckAufLos() {
            this.formState = "start";
        },
        async loginButton() {
            if (this.login.username === "" || this.login.password === "") {
                await this.loginButtonShake();
                return;
            }

            this.formState = "loading";

            const response = await useFetch("/api/auth/login", {
                method: "post",
                body: {
                    username: this.login.username,
                    password: this.login.password,
                },
            });

            if (response.status.value === "success") {
                switch (response.data.value) {
                    case "Login successful":
                        navigateTo("/home");
                        return;
                    case "continue with 2fa":
                        this.formState = "totp";
                        return;
                    case "continue with password change":
                        this.formState = "change_password";
                        return;
                    case "continue with 2fa setup":
                        navigateTo("/setup/totp");
                        return;
                    default:
                        this.formState = "start";
                        break;
                }
            }

            // show an error message
            this.formState = "error";
        },
        formatExpiraryDate(date: number) {
            const sec = Math.floor((date - Date.now()) / 1000);
            if (sec < 60) {
                return `${sec}s`;
            }
            const min = Math.floor(sec / 60);
            if (min < 60) {
                return `${min} Minuten`;
            }
        },
        async passwordlessTick() {
            if (this.passwordlessQr.length === 0) {
                clearInterval(this.passwordlessQRInterval);
                return;
            }
            // remove expired qr codes
            this.passwordlessQr = this.passwordlessQr.filter(
                (qr) => qr.expires > Date.now(),
            );

            // sort the qr codes so that the one lasting the longest is first
            this.passwordlessQr.sort((a, b) => b.expires - a.expires);
            // this makes sure that the qr code with the longest duration is being shown
            // and that the qr code is being refreshed before it expires

            // if the qr code is about to expire in the next 2 minutes, refresh it
            if (this.passwordlessQr[0].expires < Date.now() + 1000 * 60 * 2) {
                const response = await useFetch("/api/auth/passwordless/init", {
                    method: "get",
                });
                if (response.status.value === "success") {
                    const data = response.data.value;
                    if (!data) {
                        return;
                    }
                    toDataURL(data.url, (err, url) => {
                        if (err) {
                            return;
                        }
                        this.passwordlessQr.push({
                            expires: data.expires,
                            loginToken: data.token,
                            qrCodeContent: data.url,
                            qrCodeImage: url,
                        });
                    });
                }
            }

            // try to login using all qr codes
            for (const qr of this.passwordlessQr) {
                const response = await useFetch("/api/auth/passwordless/login", {
                    method: "post",
                    body: {
                        token: qr.loginToken,
                    },
                    key: `${qr.loginToken}-${Date.now()}`,
                });
                if (response.status.value === "success") {
                    // login successful
                    if (response.data.value === "Login successful") {
                        navigateTo("/home");
                        return;
                    }
                }
            }

            console.table(this.passwordlessQr);
        },
        async totpLogin() {
            console.log("totpLogin");
            if (this.login.otp.length !== 6) {
                return;
            }

            this.login.otpLoading = true;

            // this.formState = "loading";

            const response = await useFetch("/api/auth/2fa-totp", {
                method: "post",
                body: {
                    totp: this.login.otp,
                },
            });

            if (response.status.value === "success") {
                if (response.data.value?.statusCode === 200) {
                    navigateTo("/home");
                    return;
                }
            }
            this.login.otpLoading = false;
            this.login.otp = "";
            this.login.otpShake = true;
            setTimeout(() => {
                this.login.otpShake = false;
            }, 500);
        },
    },
    async beforeCreate() {
        const auth = await checkAuth({
            redirectOnMfaRequired: false,
            throwErrorOnNotAuthenticated: false,
            redirectOnPwdChange: false,
        });
        if (auth.password_change_required) {
            this.formState = "change_password";
        }
        if (auth.authenticated && !auth.mfa_required) {
            navigateTo("/home");
        }
        if (auth.authenticated && auth.mfa_required) {
            this.formState = "totp";
        }
    },
};
</script>

<template>
    <VCard class="loginform small">
        <VWindow
            v-model="formState"
            :touch="{
                start: () => {},
                end: () => {},
                move: () => {},
                left: () => {},
                right: () => {},
                up: () => {},
                down: () => {},
            }"
        >
            <VWindowItem value="start">
                <VImg class="logo" src="/img/School/DolphinSchool_light.png" />
                <VCardText>
                    <VTextField label="Benutzername" v-model="login.username" />
                    <VTextField
                        label="Passwort"
                        type="password"
                        v-model="login.password"
                    />
                    <VBtn
                        variant="flat"
                        color="primary"
                        append-icon="mdi-chevron-right"
                        @click="loginButton"
                        :class="login.buttonShake ? 'shake' : ''"
                        >Login</VBtn
                    >
                    <VBtn
                        variant="text"
                        append-icon="mdi-chevron-right"
                        class="small-btn"
                        @click="openPasswordless"
                        >Passwordless</VBtn
                    >
                    <VBtn variant="text" append-icon="mdi-chevron-right" class="small-btn"
                        >Passwort vergessen</VBtn
                    >
                </VCardText>
            </VWindowItem>
            <VWindowItem value="loading">
                <div class="loading">
                    <VProgressCircular indeterminate color="primary" />
                </div>
            </VWindowItem>
            <VWindowItem value="passwordless">
                <VImg class="logo" src="/img/School/DolphinSchool_light.png" />
                <VCardText>
                    Scanne den QR-Code mit deiner Kamera-App oder einem QR-Code Scanner
                    auf deinem Smartphone. Passwordless-QR funktioniert nur, wenn du es
                    auf deinem Smartphone eingerichtet hast.
                </VCardText>
                <VImg
                    class="qr-code"
                    v-if="passwordlessQr[0].qrCodeImage"
                    :src="passwordlessQr[0].qrCodeImage"
                />
                <VCardText>
                    Folge dann den Anweisungen auf deinem Smartphone. Anschließend wirst
                    du automatisch eingeloggt.
                    <VBtn
                        variant="outlined"
                        prepend-icon="mdi-chevron-left"
                        class="small-btn left-button"
                        @click="zurueckAufLos"
                        >Zurück</VBtn
                    >
                    QR-Code läuft ab:
                    {{ formatExpiraryDate(passwordlessQr[0]?.expires) ?? " [kein Code]" }}
                </VCardText>
            </VWindowItem>
            <VWindowItem value="totp">
                <VCardTitle> 2FA </VCardTitle>
                <VCardText>
                    Bitte gebe den 6-stelligen Code aus deiner Authenticator App ein.
                    Öffnen Sie dafür ihre Authenticator App (z.B. Google Authenticator,
                    Authy, Microsoft Authenticator, etc.) und geben Sie den Code ein.
                    <VOtpInput
                        v-model="login.otp"
                        :length="6"
                        :input-styles="{ width: '2em', height: '2em' }"
                        :input-class="['otp-input']"
                        @finish="totpLogin"
                        @complete="totpLogin"
                        :loading="login.otpLoading"
                        :class="login.otpShake ? 'shake' : ''"
                    />
                </VCardText>
            </VWindowItem>
            <VWindowItem value="change_password"> Hello! change_password </VWindowItem>
            <VWindowItem value="forgot_password">
                <VCardTitle>Passwort vergessen</VCardTitle>
                <VCardText>
                    Falls Sie Ihr Passwort vergessen haben, können Sie hier ein neues
                    Passwort beantragen. Sie erhalten von Ihrer Schule (z.B.
                    Klassenlehrkraft) ein neues Passwort.
                    <VForm @submit.prevent="">
                        <VTextField
                            label="Voller Name"
                            v-model="support.fullName"
                            :rules="[rules.required]"
                        />
                        <VTextField
                            label="E-Mail"
                            type="email"
                            hint="Deine private E-Mail Adresse, die unter der wir dich erreichen können, falls bei uns Fragen auftreten."
                            v-model="support.email"
                            :rules="[rules.required, rules.email]"
                        />
                        <VTextField
                            label="Deine Klasse/ Tutorium"
                            v-model="support.tut"
                            :rules="[rules.required]"
                        />
                        <VTextField
                            label="Klassenlehrkraft"
                            v-model="support.teacher"
                            :rules="[rules.required]"
                        />
                        <VTextarea
                            label="Beschreibung"
                            hint="Beschreibe uns dein Problem. Wir werden uns so schnell wie möglich bei dir melden."
                            v-model="support.description"
                        />
                        <VBtn
                            variant="outlined"
                            append-icon="mdi-chevron-right"
                            class="small-btn"
                            type="submit"
                        >
                            Absenden
                        </VBtn>
                        <VBtn
                            type="button"
                            variant="outlined"
                            prepend-icon="mdi-chevron-left"
                            class="small-btn left-button"
                            @click="zurueckAufLos"
                        >
                            Zurück
                        </VBtn>
                    </VForm>
                </VCardText>
            </VWindowItem>
            <VWindowItem value="error">
                <VCardTitle>upsy-daisy</VCardTitle>
                <VCardText>
                    Der Login ist fehlgeschlagen. Bitte überprüfe deine Eingaben und
                    versuche es erneut.
                    <VBtn
                        variant="outlined"
                        prepend-icon="mdi-chevron-left"
                        class="small-btn left-button"
                        @click="zurueckAufLos"
                        >Zurück</VBtn
                    >
                </VCardText>
            </VWindowItem>
        </VWindow>
    </VCard>
</template>

<style scoped></style>
