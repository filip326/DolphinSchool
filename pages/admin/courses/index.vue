<script lang="ts">
definePageMeta({
    layout: "default",
});

export default {
    data(): {
        visibleCourses: {
            name: string;
            id: string;
            teacher: string;
            student_count: number;
        }[];
        searchQuery: string;
    } {
        return {
            visibleCourses: [],
            searchQuery: "",
        };
    },
    methods: {
        async fetchCourses() {
            const response = await useFetch("/api/admin/courses", { method: "get" });
            if (response.status.value !== "success") {
                // todo Handle error with error page
                return;
            }

            this.visibleCourses = [];
            response.data.value!.map((course) => {
                this.visibleCourses.push({
                    name: course.name,
                    id: course.id,
                    teacher: course.teacher.join(", "),
                    student_count: course.student_count,
                });
            });
        },
        async search() {
            const response = await useFetch("/api/admin/courses", {
                method: "get",
                params: {
                    search: this.searchQuery,
                },
            });
            if (response.status.value !== "success") {
                // todo Handle error with error page
                return;
            }

            this.visibleCourses = [];
            response.data.value!.map((course) => {
                this.visibleCourses.push({
                    name: course.name,
                    id: course.id,
                    teacher: course.teacher.join(", "),
                    student_count: course.student_count,
                });
            });
        },
    },
    onMounted() {
        this.fetchCourses();
    },
};
</script>
<template>
    <h1>Kurse</h1>
    <VTextField
        v-model="searchQuery"
        label="Kurs suchen"
        dense
        outlined
        hide-details
        @change="search"
    >
        <template #append>
            <VBtn
                title="create user"
                link
                href="/admin/courses/create"
                prepend-icon="mdi-plus"
                color="primary"
                style="z-index: 1024"
            >
                Erstellen
            </VBtn>
        </template>
    </VTextField>
    <VSpacer />
    <VTable>
        <thead>
            <tr>
                <th>Name</th>
                <th>Lehrkraft</th>
                <th>Anzahl SuS</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="course in visibleCourses" :key="course.id">
                <td>{{ course.name }}</td>
                <td>{{ course.teacher }}</td>
                <td>{{ course.student_count }}</td>
            </tr>
        </tbody>
    </VTable>
</template>
