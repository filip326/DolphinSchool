<script lang="ts">
export default {
    name: "LoginLayout"
};
</script>

<template>
    <v-app>
        <div class="login-wrapper">
            <slot></slot>
        </div>
    </v-app>
</template>

<style>
@import url("../assets/login.css");
</style>
