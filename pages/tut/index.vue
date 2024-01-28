<script lang="ts">
definePageMeta({
    layout: "default",
});

type Course = {
    name: string;
    id: string;
    studentCount: number;
    type: "teacher" | "viceTeacher";
};

export default {
    data(): {
        courses: Course[];
    } {
        return {
            courses: [],
        };
    },

    async beforeCreate() {
        const response = await useFetch("/api/tut", {
            method: "GET",
        });
        if (response.status.value === "success") {
            const data = response.data.value;
            this.courses = data ?? [];
        }
    },
};
</script>

<template>
    <h2>Meine Klassenleitungen</h2>
    <VCard v-for="course in courses" :key="course.id">
        <VCardTitle> Klasse/Tut-Kurs {{ course.name }} </VCardTitle>
        <VCardText>
            <p>{{ course.studentCount }} Schüler:innen</p>
        </VCardText>
        <VCardActions>
            <VBtn :href="`/tut/${course.id}`" color="primary" variant="elevated">Zur Klasse</VBtn>
        </VCardActions>
    </VCard>
</template>
