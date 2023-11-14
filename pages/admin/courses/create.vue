<script lang="ts">
export default {
    data(): {
        course: {
            name: string;
            teacher: string;
            subject: string;
        };
        error: string;
        options: {
            subjects: {
                name: string;
                id: string;
            }[];
        };
    } {
        return {
            course: {
                name: "",
                teacher: "",
                subject: "",
            },
            options: {
                subjects: [],
            },
            error: "",
        };
    },
    async beforeMount() {
        await this.fetchSubjects();
    },
    methods: {
        async createCourse() {
            const response = await useFetch("/api/admin/courses", {
                method: "post",
                body: {},
            });
            if (response.status.value !== "success") {
                this.error = "Das Erstellen des Kurses ist fehlgeschlagen.";
                return;
            }

            await navigateTo(`/admin/courses/${response.data.value!.id}`);
        },
        async fetchSubjects() {
            const response = await useFetch("/api/subjects", { method: "get" });
            if (response.status.value !== "success") {
                // todo Handle error with error page
                return;
            }

            this.options.subjects = response.data.value!.map((subject) => ({
                name: subject.name,
                id: subject.id,
            }));
        },
    },
};
</script>

<template>
    <h1>Kurs erstellen</h1>

    <!--
        step 1 - grade level, subject, teacher
    -->
    <VCard>
        <VCardTitle> Fach und Lehrkraft </VCardTitle>
        <VCardText>
            <VForm>
                <VSelect
                    v-model="course.subject"
                    :items="options.subjects"
                    item-title="name"
                    item-value="id"
                    label="Fach"
                    required
                ></VSelect>
                <!-- todo: teacher form-->
            </VForm>
        </VCardText>
        <!-- todo: other things -->
    </VCard>
</template>
