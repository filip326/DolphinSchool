<script setup>
definePageMeta({
    layout: "login"
});
</script>

<script lang="ts">
export default {
    data() {
        return {
            error: {
                shown: false,
                message: ""
            }
        };
    }
};
</script>

<template>
    <VForm id="loginform">
        <VAlert v-if="error.shown" type="error" variant="text" :text="error.message" />

        <img src="/img/School/DolphinSchool_light.png" alt="Dolphin School" />
        <h1>2-Faktor Authentizierung</h1>
    </VForm>
</template>
