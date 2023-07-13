
<script setup lang="ts">
</script>

<script lang="ts">

export default {

    data() {
        return {
            absender: "Du",
            empfaenger: "",
        }
    }
}

</script>

<template>
    <VCard>

        <VCardTitle>
            Nachricht schreiben
        </VCardTitle>

        <VCardText>
            <VForm>

                <VTextField label="Absender" readonly v-model="absender" />

                <VTextField label="Empfänger" v-model="empfaenger" />

                <VTextField label="Betreff" />

                <MarkdownEditor md="# Hallo Welt" />

                <VFileInput label="Anhang (max 5 MB)"  />

            </VForm>
        </VCardText>

        <VCardActions>
            <VBtn prepend-icon="mdi-trash-can" variant="outlined">
                Verwerfen
            </VBtn>
            <VSpacer />
            <VBtn prepend-icon="mdi-content-save" variant="outlined">
                Speichern
            </VBtn>
            <VBtn prepend-icon="mdi-send" variant="outlined">
                Senden
            </VBtn>
        </VCardActions>
    </VCard>
</template>

<style scoped>
.v-btn {
    padding: 0px 20px;
}
</style>