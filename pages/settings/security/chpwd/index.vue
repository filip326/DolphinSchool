<script lang="ts">
export default {
    data() {
        return {
            formState: "old_password" as
                | "old_password"
                | "checking_old_password"
                | "info"
                | "new_password"
                | "confirm_password",
            old_pwd: "",
            new_pwd: "",
            rules: {
                required: (v: string) => !!v || "Dieses Feld ist erforderlich!",
                password: (v: string) => {
                    if (v.length < 10) {
                        return "Das Passwort muss mindestens 10 Zeichen lang sein!";
                    }
                    if (!/[a-z]/.test(v)) {
                        return "Das Passwort muss mindestens einen Kleinbuchstaben (a-z) enthalten!";
                    }
                    if (!/[A-Z]/.test(v)) {
                        return "Das Passwort muss mindestens einen Großbuchstaben (A-Z) enthalten!";
                    }
                    if (!/[0-9]/.test(v)) {
                        return "Das Passwort muss mindestens eine Ziffer (0-9) enthalten!";
                    }
                },
            },
            error: {
                shown: false,
                message: "",
            },
        };
    },
    methods: {
        async checkOldPassword() {
            if (!this.old_pwd) {
                return;
            }
            this.formState = "checking_old_password";

            const serverResponse = await useFetch("/api/setup/pwd/verify_old", {
                method: "POST",
                body: {
                    oldPassword: this.old_pwd,
                },
            });

            if (serverResponse.status.value !== "success") {
                this.error.message = "Das Passwort konnte leider nicht überprüft werden";
                this.error.shown = true;
                this.old_pwd = "";
                this.formState = "old_password";
                return;
            }

            if (serverResponse.data.value?.passwordValid) {
                this.formState = "info";
            } else {
                this.error.message = "Das Passwort ist leider falsch!";
                this.error.shown = true;
                this.old_pwd = "";
                this.formState = "old_password";
            }
        },
        async changePassword() {
            const response = await useFetch("/api/setup/pwd/change", {
                method: "POST",
                body: JSON.stringify({
                    oldPassword: this.old_pwd,
                    newPassword: this.new_pwd,
                }),
            });

            if (!response.data.value || response.error.value) {
                if (response.error?.value?.statusCode === 200) {
                    await navigateTo("/home");
                    return;
                }

                this.error.shown = true;
                this.error.message =
                    response.error?.value?.statusCode === 400
                        ? response.error.value.message
                        : "Passwort ändern fehlgeschlagen!";
                return;
            }

            if (response.data.value.success) {
                await navigateTo("/home");
                return;
            } else {
                this.error.message = "Das Passwort konnte nicht geändert werden!";
                this.error.shown = true;
            }
        },
    },
    async beforeCreate() {
        await checkAuth({
            redirectOnMfaRequired: true,
            throwErrorOnNotAuthenticated: true,
            redirectOnPwdChange: true,
        });
    },
};
</script>

<template>
    <VCard>
        <VCardTitle> Passwort ändern </VCardTitle>
        <VWindow v-model="formState">
            <VWindowItem value="old_password">
                <VCardText>
                    <p>Geben Sie bitte zunächst Ihr altes Passwort ein.</p>
                    <VTextField
                        type="password"
                        label="Altes Passwort"
                        v-model="old_pwd"
                        :rules="[rules.required]"
                        @keyup.enter="checkOldPassword()"
                    />
                    <VBtn
                        color="primary"
                        @click="checkOldPassword()"
                        :disabled="!old_pwd"
                    >
                        Weiter
                    </VBtn>
                </VCardText>
            </VWindowItem>
            <VWindowItem value="checking_old_password">
                <VCardText>
                    <VProgressCircular indeterminate color="primary" />
                    <p>Prüfe Passwort...</p>
                </VCardText>
            </VWindowItem>
            <VWindowItem value="info">
                <VCardText>
                    <p>
                        Bitte vergeben Sie im nächsten Schritt ein neues Passwort. Bitte
                        achten Sie darauf, dass ihr Passwort sicher ist.
                    </p>
                    <ul>
                        <li>
                            Ein sicheres Passwort sollte mindestens 10 Zeichen lang sein.
                        </li>
                        <li>
                            Ein sicheres Passwort sollte mindestens einen Kleinbuchstaben
                            (a-z) enthalten.
                        </li>
                        <li>
                            Ein sicheres Passwort sollte mindestens einen Großbuchstaben
                            (A-Z) enthalten.
                        </li>
                        <li>
                            Ein sicheres Passwort sollte mindestens eine Ziffer (0-9)
                            enthalten.
                        </li>
                        <li>
                            Ein sicheres Passwort sollte mindestens ein Sonderzeichen
                            enthalten.
                        </li>
                        <li>
                            Ihr Passwort sollte nicht Ihre persönlichen Daten wie z.B.
                            Name, Geburtsdatum, oder die ihrer Freunde und Verwandte
                            enththalten.
                        </li>
                    </ul>
                    <VBtn color="primary" @click="formState = 'new_password'">
                        Weiter
                    </VBtn>
                </VCardText>
            </VWindowItem>
            <VWindowItem value="new_password">
                <VCardText>
                    <p>Bitte vergeben Sie ein neues Passwort.</p>
                    <VTextField
                        type="password"
                        label="Neues Passwort"
                        v-model="new_pwd"
                        :rules="[rules.required]"
                        @keyup.enter="formState = 'confirm_password'"
                    />
                    <VBtn
                        color="primary"
                        @click="formState = 'confirm_password'"
                        :disabled="!new_pwd"
                    >
                        Weiter
                    </VBtn>
                </VCardText>
            </VWindowItem>
            <VWindowItem value="confirm_password">
                <VCardText>
                    <p>Bitte geben Sie das Passwort erneut ein.</p>
                    <VTextField
                        type="password"
                        label="Neues Passwort bestätigen"
                        :rules="[rules.required]"
                        @keyup.enter="changePassword()"
                    />
                    <VBtn color="primary" @click="changePassword()" :disabled="!new_pwd">
                        Weiter
                    </VBtn>
                </VCardText>
            </VWindowItem>
        </VWindow>
    </VCard>
    <VDialog
        v-model="error.shown"
        @click:outside="error.shown = false"
        persistent
        @keyup.esc.prevent="error.shown = false"
    >
        <VCard>
            <VCardTitle> Fehler </VCardTitle>
            <VCardText>
                <p>{{ error.message }}</p>
            </VCardText>
            <VCardActions>
                <VBtn color="primary" @click="error.shown = false"> Schließen </VBtn>
            </VCardActions>
        </VCard>
    </VDialog>
</template>

<style scoped>
.settings_form {
    padding: 20px;
}
</style>
