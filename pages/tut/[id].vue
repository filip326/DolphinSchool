<script lang="ts">
definePageMeta({
    layout: "default",
});

export default {
    data(): {
        loadingState: "loading" | "done" | "error";
        courseName: string;
    } {
        return {
            loadingState: "loading",
            courseName: "",
        };
    },

    async beforeCreate() {
        const courseId = this.$route.params.id;

        try {
            const response = await useFetch("/api/tut/:id", {
                method: "GET",
                params: {
                    id: courseId,
                },
            });
            if (response.status.value === "success") {
                const data = await response.data.value;
                this.courseName = data?.name ?? "";
                this.loadingState = "done";
            } else {
                this.loadingState = "error";
            }
        } catch {
            this.loadingState = "error";
        }
    },
};
</script>

<template>
    <VCard v-if="loadingState === 'done'">
        <VCardTitle> {{ courseName }} </VCardTitle>
    </VCard>
    <VCard v-else-if="loadingState === 'loading'">
        <VCardTitle> Loading... </VCardTitle>
        <VCardText>
            <VProgressCircular indeterminate></VProgressCircular>
        </VCardText>
    </VCard>
    <VCard v-else-if="loadingState === 'error'">
        <VCardTitle> Error </VCardTitle>
    </VCard>
</template>

<style scoped></style>
