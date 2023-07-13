<script lang="ts">
export default {
    name: "MarkdownEditor",
    data() {
        return {
            md: "",
            tab: null
        };
    }
};
</script>

<template>
    <VCard color="surface" elevation="0">
        <VTabs v-model="tab">
            <VTab value="edit" prepend-icon="mdi-pencil">
                Bearbeiten
            </VTab>
            <VTab value="preview" prepend-icon="mdi-eye-outline">
                Vorschau
            </VTab>
        </VTabs>
        <VCardText>
            <VWindow v-model="tab">
                <VWindowItem value="edit">
                    <VTextarea v-model="md" label="Ihre Nachricht" variant="outlined" counter auto-grow />
                </VWindowItem>
                <VWindowItem value="preview">
                    <Markdown :md="md" />
                </VWindowItem>
            </VWindow>
        </VCardText>
    </VCard>
</template>
  

<style scoped>
.v-textarea {
    margin-top: 10px;
}
</style>