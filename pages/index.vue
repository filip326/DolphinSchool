<script setup lang="ts">
definePageMeta({
    layout: 'login'
});
</script>

<template>
    <v-form id="loginform">
        <img src="/img/School/DolphinSchool_light.png" alt="Dolphin School" />
        <h1>Login</h1>
        <v-text-field label="Benutzername" placeholder="max.mustermann"
            hint="Dein Benutzername besteht aus deinem Vor- und Nachnamen, durch einen Punkt getrennt."></v-text-field>
        <v-text-field label="Passwort" type="password" placeholder="P@55w0rt"
            hint="Gebe hier dein Passwort ein."></v-text-field>
        <v-btn size="large" variant="outlined">Einloggen</v-btn>
        <a href="/support">Hilfe und Support</a>
        <a href="">Zugangsdaten vergessen</a>
    </v-form>
</template>

<style scoped>
@import url("../assets/login.css");
</style>
