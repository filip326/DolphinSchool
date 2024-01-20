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
            this.formState = "checking_old_password";
            

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
                this.error.shown = true;
                this.error.message = "Das Passwort konnte nicht geändert werden!";
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
        </VWindow>
    </VCard>
</template>

<style scoped>
.settings_form {
    padding: 20px;
}
</style>
