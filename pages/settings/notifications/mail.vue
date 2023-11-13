<script lang="ts">
export default {
    async beforeCreate() {
        await checkAuth({
            redirectOnMfaRequired: true,
            redirectOnPwdChange: true,
            throwErrorOnNotAuthenticated: true,
        });
    },
    data(): {
        error: {
            show: boolean;
            message: string;
        };
        status:
            | "subscribed"
            | "verification-pending"
            | "not-subscribed"
            | "loading"
            | "unknown";
        mailingAdress: string;
        verificationCode: string;
        repeatMailingAdress: string;

        rules: {
            haxadecimal: (v: string) => boolean | string;
            sixDigits: (v: string) => boolean | string;
            email: (v: string) => boolean | string;
        };
    } {
        return {
            error: {
                show: false,
                message: "",
            },

            status: "loading",
            mailingAdress: "",
            repeatMailingAdress: "",

            verificationCode: "",

            rules: {
                haxadecimal: (v: string) => {
                    return (
                        /^[0-9a-fA-F]+$/.test(v) ||
                        "Bitte geben Sie einen gültigen Code ein"
                    );
                },
                sixDigits: (v: string) => {
                    return v.length === 6 || "Bitte geben Sie einen 6-stelligen Code ein";
                },
                email: (v: string) => {
                    return (
                        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ||
                        "Bitte geben Sie eine gültige E-Mail Adresse ein"
                    );
                },
            },
        };
    },
    async beforeMount() {
        const response = await useFetch("/api/email/status", { method: "get" });
        if (response.status.value === "success") {
            if (response.data.value?.subscribed === true) {
                if (response.data.value?.verified === true) {
                    this.status = "subscribed";
                    this.mailingAdress = response.data.value?.email ?? this.mailingAdress;
                } else {
                    this.status = "verification-pending";
                    this.mailingAdress = response.data.value?.email ?? this.mailingAdress;
                }
            } else if (response.data.value?.subscribed === false) {
                this.status = "not-subscribed";
            }
        } else {
            this.error.show = true;
            this.error.message = "Fehler beim Laden der Daten";
            this.status = "loading";
        }
    },

    methods: {
        isEmailMatch() {
            return (
                this.mailingAdress === this.repeatMailingAdress ||
                "Die E-Mail Adressen stimmen nicht überein."
            );
        },
        async subscribe() {
            // check if email is valid using regex
            if (!this.mailingAdress.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                this.error.show = true;
                this.error.message = "Bitte geben Sie eine gültige E-Mail Adresse ein";
                return;
            }

            const response = await useFetch("/api/email/subscribe", {
                method: "post",
                body: {
                    email: this.mailingAdress,
                },
            });

            if (response.status.value === "success") {
                this.status = "verification-pending";
            } else {
                this.error.show = true;
                this.error.message = "Fehler beim Abonnieren der E-Mails";
            }

            this.mailingAdress = "";
        },
        async unsubscribe() {
            const response = await useFetch("/api/email/subscribtion", {
                method: "delete",
            });

            if (response.status.value === "success") {
                this.status = "not-subscribed";
            } else {
                this.error.show = true;
                this.error.message = "Fehler beim Abbestellen der E-Mails";
            }
        },

        async verify() {
            const response = await useFetch("/api/email/verify", {
                method: "post",
                body: {
                    code: this.verificationCode,
                },
            });

            if (
                response.status.value === "success" &&
                response.data.value?.success === true
            ) {
                this.status = "subscribed";
            } else {
                this.error.show = true;
                this.error.message = "Fehler beim Verifizieren der E-Mail Adresse";
                if (response.data.value?.newCodeCreated) {
                    this.error.message += `\nSie haben die maximale Anzahl an Versuchen erreicht. Es wurde ein neuer Code erstellt und Ihnen per E-Mail an ${this.mailingAdress}zugesandt.`;
                }
            }

            this.verificationCode = "";
        },

        async resendCode() {
            const response = await useFetch("/api/email/resend", {
                method: "post",
            });

            if (response.status.value === "success") {
                this.error.show = true;
                this.error.message = `Ein neuer Code wurde an ${this.mailingAdress} gesendet.`;
            } else {
                this.error.show = true;
                this.error.message = "Fehler beim erneuten Senden des Codes";
            }
        },
    },
};
</script>

<template>
    <VCard>
        <VCardTitle>E-Mail Benachrichtigungen</VCardTitle>
        <VCardText v-if="status === 'loading'">
            <VProgressCircular indeterminate color="primary" />
        </VCardText>
        <VCardText v-else-if="status === 'unknown'">
            <VIcon color="error">mdi-alert</VIcon>
            <span>Unbekannter Fehler</span>
        </VCardText>
        <VCardText v-else-if="status === 'subscribed'">
            <VIcon color="success">mdi-check</VIcon>
            <span>Sie haben E-Mail Benachrichtigungen abonniert!</span>
            <VTextField readonly label="E-Mail Adresse" v-model="mailingAdress" />
            <VBtn color="primary" @click="unsubscribe">Abbestellen</VBtn>
        </VCardText>
        <VCardText v-else-if="status === 'verification-pending'">
            <VIcon color="success">mdi-check</VIcon>
            <span>
                Wir haben Ihnen eine E-Mail an {{ mailingAdress }} gesendet. Bitte geben
                Sie den 6-stelligen Code aus der E-Mail ein.
            </span>
            <VTextField
                label="Code"
                v-model="verificationCode"
                @input="verificationCode = verificationCode.toUpperCase()"
            />
            <VBtn
                color="primary"
                :disabled="
                    verificationCode.length !== 6 ||
                    !verificationCode.match(/^[0-9A-F]+$/)
                "
            >
                Bestätigen
            </VBtn>
            <a @click="resendCode">Ich habe keinen Code bekommen.</a>
            <a @click="unsubscribe">E-Mail korrigieren</a>
            <a @click="unsubscribe">E-Mail einrichtung abbrechen.</a>
        </VCardText>
        <VCardText v-else-if="status === 'not-subscribed'">
            <span>
                Sie haben E-Mail Benachrichtigungen nicht abonniert. Bitte geben Sie Ihre
                E-Mail Adresse ein, um E-Mail Benachrichtigungen zu erhalten.
            </span>
            <VTextField
                label="E-Mail Adresse"
                v-model="mailingAdress"
                :rules="[rules.email]"
            />
            <VTextField
                label="E-Mail Adresse wiederholen"
                v-model="repeatMailingAdress"
                :rules="[rules.email, isEmailMatch]"
            />
            <VBtn color="primary" @click="subscribe">Abonnieren</VBtn>
        </VCardText>
    </VCard>

    <VDialog
        v-model="error.show"
        max-width="500"
        persistent
        @click:outside="error.show = false"
        @keydown.esc="error.show = false"
    >
        <VCard>
            <VCardTitle>Fehler</VCardTitle>
            <VCardText>
                <VIcon>mdi-alert</VIcon>
                {{ error.message }}
            </VCardText>
            <VCardActions>
                <VBtn color="primary" @click="error.show = false">Schließen</VBtn>
            </VCardActions>
        </VCard>
    </VDialog>
</template>

<style scoped>
.check-result {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 20px;
    text-align: center;
}
</style>
