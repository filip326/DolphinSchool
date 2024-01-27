<script lang="ts">
definePageMeta({
    layout: "default",
});

export default {
    data(): {
        openTab: "main";
        loadingState: "loading" | "done" | "error";
        courseName: string;
        courseTeacher: string;
        courseViceTeacher?: string;
    } {
        return {
            openTab: "main",
            loadingState: "loading",
            courseName: "",
            courseTeacher: "",
            courseViceTeacher: undefined,
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
                this.courseTeacher = data?.teacher.name ?? "";
                this.courseViceTeacher = data?.viceTeacher?.name;
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
        <VCardText>
            <VTabs v-model="openTab">
                <VTab value="main"> Main </VTab>
            </VTabs>
            <VWindow v-model="openTab">
                <VWindowItem value="main">
                    <p><VIcon>mdi-teacher</VIcon> {{ courseTeacher }}</p>

                    <p v-if="courseViceTeacher">
                        <VIcon>mdi-teacher</VIcon> {{ courseViceTeacher }}
                    </p>
                </VWindowItem>
            </VWindow>
        </VCardText>
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
