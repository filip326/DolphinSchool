<script lang="ts">
export default {
    name: "OneLinkCard",
    props: {
        title: {
            type: String,
            required: true,
        },
        href: {
            type: String,
            required: true,
        },
    },
};
</script>

<template>
    <VCard @click="navigateTo(href)">
        <VCardTitle>
            {{ title }}
        </VCardTitle>
        <VCardActions>
            <VBtn prepend-icon="mdi-open-in-new" variant="outlined">Aufrufen</VBtn>
        </VCardActions>
    </VCard>
</template>

<style scoped></style>
