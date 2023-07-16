<script lang="ts">
export default {
    name: 'DefaultLayout'
}
</script>

<template>
    <v-app>
        <div class="login-wrapper">
            <slot></slot>
        </div>
    </v-app>
</template>

<style scoped>
@import url("../assets/login.css");
</style>
