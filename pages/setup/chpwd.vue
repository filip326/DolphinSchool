<script setup>
definePageMeta({
    layout: "login",
});
</script>

<script>
export default {
    data() {
        return {
            old_pwd: "",
            new_pwd: "",
            rules: {
                required: (v) => !!v || "Dieses Feld ist erforderlich!",
                wiederholen: (v) => v === this.new_pwd || "Die Passwörter stimmen nicht überein!",
                notsame: (v) => v !== this.old_pwd || "Das neue Passwort muss sich vom alten unterscheiden!",
            },
            error: {
                shown: false,
                message: "",
            },
        };
    },
    methods: {
        async changePassword() {
            const response = await useFetch("/api/setup/pwd/change", {
                method: "POST",
                body: JSON.stringify({
                    oldPassword: this.old_pwd,
                    newPassword: this.new_pwd,
                }),
            });

            if (!response.data.value || response.error.value) {
                if (response.error.value.statusCode === 200) {
                    await navigateTo("/home");
                    return;
                }

                this.error.shown = true;
                this.error.message =
                    response.error.statusCode === 400 ? "Ungültiges Passwort" : "Passwort ändern fehlgeschlagen!";
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
    async beforeMount() {
        await checkAuth({
            redirectOnMfaRequired: true,
            throwErrorOnNotAuthenticated: true,
            redirectOnPwdChange: false,
        });
    },
};
</script>

<template>
    <div class="loginform">
        <VForm @submit.prevent="changePassword()">
            <VAlert v-if="error.shown" type="error" variant="text" :text="error.message" />

            <p>
                Sie müssen Ihr Passwort ändern. Geben Sie Ihr bisheriges Passwort ein. Wählen Sie anschließend ein neues
                Passwort und wiederholen Sie dieses.
            </p>

            <VTextField v-model="old_pwd" label="bisheriges Passwort" type="password" :rules="[rules.required]" />
            <VTextField
                v-model="new_pwd"
                label="neues Passwort"
                type="password"
                :rules="[rules.required, rules.notsame]"
            />
            <VTextField label="Passwort wiederholen" type="password" :rules="[rules.required, rules.wiederholen]" />

            <VBtn type="submit" color="primary" class="mr-4">Passwort ändern</VBtn>
        </VForm>
    </div>
</template>

<style scoped>
@import url(../../assets/login.css);
</style>
