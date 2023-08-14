<script setup>
import QRCode from "qrcode";

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
            qr_code: "",
            rules: {
                required: (v) => !!v || "Dieses Feld ist erforderlich!"
            },
            userInfo: {
                fullName: "" | undefined,
                username: "" | undefined,
            },
            error: {
                shown: false,
                message: ""
            }
        };
    },
    methods: {
        async submit2FA() {
            const tempQRCode = this.qr_code;
            this.qr_code = "";

            const res = await useFetch("/api/setup/2fa/confirm", {
                method: "POST",
                body: JSON.stringify({
                    totp: this.code
                })
            });

            if (res.status.value !== "success" || res.data.value !== "Ok") {
                this.error = {
                    shown: true,
                    message: "Ungültiger TOTP-Code! Versuchen Sie es bitte erneut."
                };
                this.qr_code = tempQRCode;
                return;
            }

            navigateTo("/home");
        },

        async skip() {
            await useFetch("/api/setup/2fa/cancel", { method: "POST" });
            navigateTo("/home");
        },

        async totpSecret() {
            const res = await useFetch("/api/setup/2fa/secret", { method: "GET" });
            return res.data.value.secret;
        }
    },
    async beforeMount() {
        await checkAuth();

        this.totpSec = await this.totpSecret();

        QRCode.toDataURL(this.totpSec, {
            errorCorrectionLevel: "L",
            rendererOpts: { quality: 0.3 },
            width: 128,
            margin: 1

            
        }, (err, dataUrl) => {
            if (err) {
                this.error.shown = true;
                this.error.message = "Fehler beim Laden des QR Codes. Bitte überspringen Sie die Einrichtung.";
                return;
            }
            this.qr_code = dataUrl;
        });
    },
};
</script>

<template>
    <div class="loginform">
        
        <div>
            <div>
                <h1>2FA</h1>
                <ol>
                    <li>Ihr Konto hat keine 2-Faktor-Authentifizierung (2FA), die die Sicherheit erheblich erhöht.</li>
                    <li>Installieren Sie eine App wie "Authy" auf Ihrem Smartphone, um 2-Faktor-Authentifizierung zu
                        aktivieren.</li>
                    <li>Scannen Sie den QR-Code und geben Sie den angezeigten 6-stelligen Code ein.</li>
                    <li>Dies schützt Ihr Konto vor Cyberangriffen und erfordert den Code von Ihrem Smartphone für den
                        Zugriff.</li>
                </ol>
                <ul>
                    <li>Das Überspringen der Einrichtung macht Ihr Konto anfälliger für Cyberangriffe.</li>
                    <li>Sie können die 2-Faktor-Authentifizierung später einrichten.</li>
                    <li><b>Nach der Einrichtung ist ein Zugriff auf das Konto nur mit Ihrem Smartphone möglich.</b></li>
                </ul>
            </div>
        </div>

        <VForm @submit.prevent="submit2FA">
            <VAlert v-if="error.shown" type="error" variant="text" :text="error.message" />

            <p>Scannen Sie diesen QR Code mit Ihrer Authentizierungs-App auf dem Smartphone ein:</p>
            <div class="qr-code">
                <VImg v-if="qr_code" :src="qr_code" />
                <VProgressCircular v-else indeterminate color="primary" />
            </div>

            <VTextField v-model="code" label="Code" name="code" type="text" :rules="[rules.required]" />

            <VBtn type="submit" color="primary" class="mr-4">2FA-Aktivieren</VBtn>
            <VBtn @click:prevent="skip">Überspringen</VBtn>
        </VForm>
    </div>
</template>

<style scoped>
@import url(../../assets/login.css);

.qr-code {
    width: 128px;
    height: 128px;
    margin: 0 auto;
}
</style>
