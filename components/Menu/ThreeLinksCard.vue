<script lang="ts">
export default {
    name: "ThreeLinksCard",
    props: {
        title: {
            type: String,
            required: true,
        },
        links: {
            type: Array<{
                href: string;
                text: string;
            }>,
            required: true,
        },
    },
};
</script>

<template>
    <VCard>
        <VCardTitle>
            {{ title }}
        </VCardTitle>
        <VCardActions
            style="display: flex; flex-direction: column; gap: 10px; align-items: center"
        >
            <VBtn
                width="100%"
                v-for="link in links"
                :key="link.href"
                :href="link.href"
                variant="outlined"
                >{{ link.text }}</VBtn
            >
        </VCardActions>
    </VCard>
</template>

<style scoped>
.v-btn {
    margin-inline-start: 0 !important;
}
</style>
