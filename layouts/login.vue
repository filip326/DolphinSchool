<script lang="ts">
export default {
    name: "LoginLayout",
};
</script>

<template>
    <VApp>
        <div class="login-wrapper">
            <slot></slot>
        </div>

        <DolphinFooter />
    </VApp>
</template>

<style>
@import url("../assets/login.css");
</style>
