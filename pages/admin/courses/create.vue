<script lang="ts">
export default {
    data(): {
        course: {
            teachers: string[];
            subject: string;
            students: Array<string>;
        };
        error: string;
        options: {
            subjects: {
                name: string;
                id: string;
            }[];
        };
        rules: {
            required: (value: string) => boolean | string;
        };
    } {
        return {
            course: {
                teachers: Array<string>(),
                subject: "",
                students: Array<string>(),
            },
            options: {
                subjects: [],
            },
            error: "",
            rules: {
                required: (value: string | string[]) => {
                    return !!value || "Dieses Feld ist erforderlich.";
                },
            },
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
    <VForm @submit.prevent="createCourse">
        <VCard>
            <VCardTitle> Fach und Lehrkraft </VCardTitle>
            <VCardText>
                <VSelect
                    v-model="course.subject"
                    :items="options.subjects"
                    item-title="name"
                    item-value="id"
                    label="Fach"
                    :rules="[rules.required]"
                />
                <ASMSQSearchField
                    label="Lehrkraft"
                    :multi="true"
                    v-model="course.teachers"
                />
            </VCardText>
        </VCard>
        <br />
        <VCard>
            <VCardTitle> Schüler*innen </VCardTitle>
            <VCardText>
                <ASMSQSearchField
                    v-model="course.students"
                    label="Schüler*innen"
                    :multi="true"
                />
            </VCardText>
        </VCard>
        <br />
        <VCard>
            <VCardTitle> Kurs erstellen </VCardTitle>
            <VCardActions>
                <VBtn variant="flat" type="submit" color="primary"> Erstellen </VBtn>
                <VBtn to="/admin/courses" variant="flat" type="button" color="error">
                    Abbrechen
                </VBtn>
            </VCardActions>
        </VCard>
    </VForm>
</template>
