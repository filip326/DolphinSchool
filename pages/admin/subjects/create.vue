<script lang="ts">
definePageMeta({
    layout: "default",
});
export default {
    data(): {
        subject_name: string;
        subject_short_name: string;
        subject_color: { r: number; g: number; b: number };
        rules: {
            required: (value: string) => boolean;
            counter: (value: string) => boolean;
        };
    } {
        return {
            subject_name: "",
            subject_short_name: "",
            subject_color: { r: 0, g: 0, b: 0 },
            rules: {
                required: (value: string) => !!value || !!"Dieses Feld ist erforderlich",
                counter: (value: string) => value.length <= 3 || !!"Maximal 3 Zeichen",
            },
        };
    },
    methods: {
        async createSubject() {
            const response = await useFetch("/api/admin/subject", { method: "post" });
            if (response.status.value === "success") {
                this.$router.push("/admin/subjects");
            }
            // TODO: #51 implement error handling
        },
    },
};
</script>
<template>
    <h1>Fach erstellen</h1>
    <VCard>
        <VCardText>
            <VTextField v-model="subject_name" label="Fachname" required></VTextField>
            <VTextField
                v-model="subject_short_name"
                label="Fachkürzel"
                required
                :counter="3"
            ></VTextField>
            <VColorPicker v-model="subject_color" label="Fachfarbe"></VColorPicker>
            <VBtn
                @click="createSubject"
                :disabled="subject_name.length < 1 || subject_short_name.length < 1"
            >
                Erstellen
            </VBtn>
        </VCardText>
    </VCard>
</template>
