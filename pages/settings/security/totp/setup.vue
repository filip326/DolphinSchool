<template>
    <div class="settings_form">
        <section class="settings_info">
            <div>
                <h1>2FA</h1>
                <ol>
                    <li>
                        Ihr Konto hat keine 2-Faktor-Authentizierung (2FA), die die Sicherheit Ihres
                        Kontos erheblich erhöht.
                    </li>
                    <li>
                        Installieren Sie eine App wie "Authy" (oder eine andere) auf Ihrem
                        Smartphone, um die 2-Faktor-Authentifizierung zu aktivieren.
                    </li>
                    <li>
                        Scannen Sie den QR-Code und geben Sie den angezeigten 6-stelligen Code ein.
                    </li>
                    <li>
                        Dies schützt Ihr Konto vor Cyberangriffen und erfordert den Code von Ihrem
                        Smartphone für den Zugriff.
                    </li>
                </ol>
                <ul>
                    <li>
                        Das Überspringen der Einrichtung macht Ihr Konto anfälliger für
                        Cyberangriffe.
                    </li>
                    <li>Sie können die 2-Faktor-Authentizierung später einrichten.</li>
                    <li>
                        <b
                            >Nach der Einrichtung ist ein Zugriff auf das Konto nur mit Ihrem
                            Smartphone möglich.</b
                        >
                    </li>
                </ul>
            </div>
        </section>

        <VForm @submit.prevent="submit2FA()">
            <VAlert v-if="error.shown" type="error" variant="text" :text="error.message" />

            <p>Scannen Sie diesen QR Code mit Ihrer Authentizierungs-App auf dem Smartphone ein:</p>
            <div class="qr-code">
                <VImg v-if="qr_code" :src="qr_code" />
                <VProgressCircular v-else indeterminate color="primary" />
            </div>

            <VTextField
                v-model="code"
                label="Code"
                name="code"
                type="text"
                :rules="[rules.required, rules.totpLength, rules.totpNumbers]"
            />

            <VBtn type="submit" color="primary" class="mr-4">2FA-Aktivieren</VBtn>
        </VForm>
    </div>
</template>

<script lang="ts">
import QRCode from "qrcode";

export default {
    data() {
        return {
            code: "",
            totpSec: "",
            qr_code: "",
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
            const tempQRCode = this.qr_code;
            this.qr_code = "";

            const res = await useFetch("/api/setup/2fa/confirm", {
                method: "POST",
                body: JSON.stringify({
                    totp: this.code,
                }),
            });

            if (res.status.value !== "success" || res.data.value !== "Ok") {
                this.error = {
                    shown: true,
                    message: "Ungültiger TOTP-Code! Versuchen Sie es bitte erneut.",
                };
                this.qr_code = tempQRCode;
                return;
            }

            navigateTo("/home");
        },

        async totpSecret() {
            const res = await useFetch("/api/setup/2fa/secret", { method: "GET" });
            if (!res.data.value) {
                this.error.shown = true;
                this.error.message =
                    "Fehler beim Laden des TOTP-Secrets. Bitte überspringen Sie die Einrichtung.";
                return;
            }
            return res.data.value.secret;
        },
    },
    async beforeCreate() {
        const checkAuthRes = await checkAuth({
            redirectOnMfaRequired: true,
            throwErrorOnNotAuthenticated: true,
            redirectOnPwdChange: true,
        });

        if (checkAuthRes.user.mfa_enabled) {
            await navigateTo("/settings/security/totp/disable");
            return;
        }
    },
    async beforeMount() {
        const resTOTPSec = await this.totpSecret();
        if (!resTOTPSec) {
            this.error.shown = true;
            this.error.message =
                "Fehler beim Laden des QR Codes. Bitte versuchen Sie es später erneut.";
            return;
        }

        this.totpSec = resTOTPSec;

        QRCode.toDataURL(
            this.totpSec,
            {
                errorCorrectionLevel: "L",
                rendererOpts: { quality: 0.3 },
                width: 128,
                margin: 1,
            },
            (err, dataUrl) => {
                if (err) {
                    this.error.shown = true;
                    this.error.message =
                        "Fehler beim Laden des QR Codes. Bitte versuchen Sie es später erneut.";
                    return;
                }
                this.qr_code = dataUrl;
            },
        );
    },
};
</script>

<style scoped>

.qr-code {
    width: 128px;
    height: 128px;
    margin: 0 auto;
}
</style>
