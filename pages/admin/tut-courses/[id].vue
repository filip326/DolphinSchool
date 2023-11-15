<script lang="ts">
interface ITutCourse {
    grade: number; // 5-13; 11 = E, 12 = Q1/2, 13 = Q3/4
    name: string; // grade + letter in grades 5-10, grade + teacher's name in grades 11-13

    teacher: string;
    viceTeacher?: string;

    students: string[];
}

export default {
    async beforeCreate() {
        await checkAuth({
            redirectOnMfaRequired: true,
            redirectOnPwdChange: true,
            throwErrorOnNotAuthenticated: true,
        });
    },
    data() {
        return {
            error: {
                message: "",
                show: false,
            },
            course: null as ITutCourse | null,
        };
    },
    async beforeMount() {
        const id = this.$route.params.id;
        const res = await useFetch(`/api/admin/tut-courses/${id}`, {
            method: "GET",
        });

        if (res.status.value == "success") {
            this.course = res.data.value;
        } else {
            this.course = null;
            throw createError({
                fatal: true,
                statusMessage: "Tut-Course wurde nicht gefunden",
                statusCode: 404,
            });
        }
    },
};
</script>

<template>Test</template>
