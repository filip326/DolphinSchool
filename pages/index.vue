<script setup lang="ts">
definePageMeta({
    layout: 'login'
});
</script>

<script lang="ts">
export default defineComponent({
    data() {
        return {
            username: '',
            pwd: '',
            error: {
                shown: false,
                message: ''
            }
        }
    },
    beforeMount() {
        useFetch("/api/whoami").then(({ data, error }) => {
            if (!error && data) {
                navigateTo("/home");
            }
        });
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

            if (!response.error.value && response.data) {
                navigateTo("/home");
            } else {
                if (response.error) {
                    console.error(response.error)
                    this.error.shown = true;
                    if (response.error.value?.statusCode == 401) {
                        this.error.message = "Ungültige Login-Daten";
                    } else {
                        this.error.message = "Beim Login ist ein Fehler aufgetreten";
                    }
                }
            }
        }
    }
});
</script>

<template>
    <v-form id="loginform" @submit.prevent="login">
        <VAlert v-if="error.shown" type="error" variant="text" :text="error.message" />
        <img src="/img/School/DolphinSchool_light.png" alt="Dolphin School" />
        <h1>Login</h1>
        <v-text-field label="Benutzername" v-model="username" placeholder="max.mustermann"
            hint="Dein Benutzername besteht aus deinem Vor- und Nachnamen, durch einen Punkt getrennt."></v-text-field>
        <v-text-field label="Passwort" v-model="pwd" type="password" placeholder="P@55w0rt"
            hint="Gebe hier dein Passwort ein."></v-text-field>
        <v-btn type="submit" size="large" variant="outlined">Einloggen</v-btn>
        <NuxtLink to="">Zugangsdaten vergessen</NuxtLink>
        <NuxtLink to="/support">Hilfe und Support</NuxtLink>
    </v-form>
</template>

<style scoped>
@import url("../assets/login.css");
</style>
