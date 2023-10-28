<script lang="ts">
interface ICourse {
    _id: string;
    teacher: string;
    name: string;
    subject: string;
    members: string[];
}

export default {
    data() {
        return {
            error: {
                show: false,
                message: "",
            },
            course: {} as ICourse,
            subjects: [] as { name: string; id: string }[],
        };
    },
    async beforeCreate() {
        await checkAuth({
            redirectOnMfaRequired: true,
            throwErrorOnNotAuthenticated: true,
            redirectOnPwdChange: true,
        });
    },
    async beforeMount() {
        const id = this.$route.params.id;
        const res = await useFetch(`/api/admin/courses/${id}`, {
            method: "GET",
        });
        if (res.status.value === "success" && res.data.value) {
            this.course = res.data.value as ICourse;
        } else {
            this.error.show = true;
            this.error.message = "Fehler beim Laden des Kurses";
        }
        await this.fetchSubjects();
    },
    methods: {
        async fetchSubjects() {
            const response = await useFetch("/api/subjects", { method: "GET" });
            if (response.status.value !== "success") {
                // todo Handle error with error page
                return;
            }

            console.log(response.data.value);

            this.subjects = response.data.value!.map((subject) => ({
                name: subject.name,
                id: subject.id,
            }));
        },
    },
};
</script>

<template>
    <VAlert v-if="error.show" title="Fehler" type="error" :text="error.message" />
    <VForm>
        <VTextField label="Name" v-model="course.name" />
        <SearchUser label="Lehrkraft" :limit="1" :preInput="[course.teacher]" />
        <VSelect
            v-model="course.subject"
            :items="subjects"
            item-title="name"
            item-value="id"
            label="Fach"
            :hint="`${course.subject}`"
            required
        ></VSelect>
        <SearchUser label="SchülerInnen" :preInput="course.members" />
    </VForm>
</template>

<style scoped></style>
