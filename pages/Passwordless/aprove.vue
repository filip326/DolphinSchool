<script setup lang="ts">
definePageMeta({
    title: "passwordless",
    layout: "non"
});
</script>

<script lang="ts">

export default {
    data() {
        return {
            continue_button: {
                loading: true,
            }
        };
    },
    methods: {
        async aprove() {
            this.continue_button.loading = true;
            const response = await useFetch("")
        }
    }
};
</script>

<template>
    <VCard>
        <VCardTitle>passwordless Login</VCardTitle>

        <VCardText>
            <ul>
                <li>Prüfe die URL in der Adresszeile des Browsers. Logge dich <u>nicht</u> ein, wenn du dir nicht sicher bist, dass du auf der Website von DolphinSchool bist.</li>
                <li>Drücke nun auf den Button weiter.</li>
                <li>Du wirst automatisch angemeldet.</li>
            </ul>
        </VCardText>

        <VCardActions>
            <VBtn color="primary" @click="aprove" :loading="continue_button.loading">Weiter</VBtn>
        </VCardActions>

    </VCard>
</template>