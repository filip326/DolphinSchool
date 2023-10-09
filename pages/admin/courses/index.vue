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
