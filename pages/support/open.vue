<script lang="ts">
definePageMeta({
    layout: "login",
});
export default {
    data() {
        return {
            supportcode: "",
            rules: {
                // required
                required: (v: string) => !!v || "Dieses Feld ist erforderlich",
            },
            error: {
                shown: false,
                message: "",
            },
        };
    },
};
</script>

<template>
    <div class="loginform">
        <VForm>
            <VAlert v-if="error.shown" type="error" variant="text" :text="error.message" />
            <h1>Ticket öffnen</h1>
            <VTextField
                v-model="supportcode"
                label="Support Code"
                hint="Ihr Code, welchen Sie beim Erstellen des Tickets erhalten haben."
                :rules="[rules.required]"
            />
            <VBtn type="submit" size="large" variant="outlined">Öffnen</VBtn>
            <NuxtLink to="/support">Ticket erstellen</NuxtLink>
        </VForm>
        <div>
            <h1>Support Ablauf</h1>
            <p></p>
        </div>
    </div>
</template>

<style scoped>
@import url("../../assets/login.css");
</style>
