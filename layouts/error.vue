<script lang="ts">
export default {
    name: 'ErrorLayout'
}
</script>

<template>
    <v-app>
        <div class="error-wrapper">
            <slot></slot>
        </div>
    </v-app>
</template>

<style scoped>
@import url("../assets/error.css");
</style>
