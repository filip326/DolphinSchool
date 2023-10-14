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
    } {
        return {
            visibleCourses: [],
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
            response.data.value!.map(course => {
                this.visibleCourses.push({
                    name: course.name,
                    id: course.id,
                    teacher: course.teacher.join(", "),
                    student_count: course.student_count,
                });
            });
        }
    },
    beforeCreate() {
        this.fetchCourses();
    },
};
</script>
<template>
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
