<script lang="ts">
definePageMeta({
    title: "Wiki - Bereich erstellen",
    layout: "default",
});
export default {
    data(): {
        name: string;
        description: string;
        rules: {
            nameLength: (v: string) => boolean | string;
            descriptionLength: (v: string) => boolean | string;
        };
    } {
        return {
            name: "",
            description: "",
            rules: {
                nameLength: (v: string) => v.length <= 50 || "Name ist zu lang",
                descriptionLength: (v: string) =>
                    v.length <= 500 || "Beschreibung ist zu lang",
            },
        };
    },
    methods: {
        async createSpace() {
            if (!this.name || !this.description) return;
            const response = await useFetch("/api/wiki/space", {
                method: "post",
                body: {
                    name: this.name,
                    description: this.description,
                },
                key: Date.now().toString(),
            });
            if (response.status.value === "success") {
                this.$router.push(`/wiki/${response.data.value!.url}`);
            }
        },
    },
};
</script>
<template>
    <h1>Wiki</h1>
    <h2>Bereich erstellen</h2>
    <VCard>
        <VCardText>
            <VTextField
                v-model="name"
                label="Name"
                :rules="[rules.nameLength]"
                counter="50"
            />
            <VTextField
                v-model="description"
                label="Beschreibung"
                :rules="[rules.descriptionLength]"
                counter="500"
            />
            <VBtn
                :disabled="
                    !name || !description || name.length > 50 || description.length > 500
                "
                @click="createSpace"
                >Erstellen</VBtn
            >
        </VCardText>
    </VCard>
</template>
