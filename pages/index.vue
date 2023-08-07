<script setup lang="ts">
definePageMeta({
    layout: "login"
});
</script>

<script lang="ts">
export default defineComponent({
    data() {
        return {
            username: "",
            pwd: "",
            error: {
                shown: false,
                message: ""
            }
        };
    },
    async beforeMount() {
        const user = await checkAuthAndReturnUserOrNull({
            throwErrorOnFailure: false
        });
        console.log(user);
        if (user) {
            navigateTo("/home");
        }
    },
    methods: {
        async login() {
            const response = await useFetch("/api/login", {
                method: "POST",
                body: JSON.stringify({
                    username: this.username,
                    password: this.pwd
                })
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
                    navigateTo("/setup/2fa");
                    break;
                default:
                    this.error.shown = true;
                    this.error.message = "Login fehlgeschlagen";
                    break;
            }
        }
    }
});
</script>

<template>
    <VForm id="loginform" @submit.prevent="login">
        <VAlert v-if="error.shown" type="error" variant="text" :text="error.message" />
        <img src="/img/School/DolphinSchool_light.png" alt="Dolphin School" />
        <h1>Login</h1>
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
        <NuxtLink to="">Zugangsdaten vergessen</NuxtLink>
        <NuxtLink to="/support">Hilfe und Support</NuxtLink>
    </VForm>
</template>

<style scoped>
@import url("../assets/login.css");
</style>
