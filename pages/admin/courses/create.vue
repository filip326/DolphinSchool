<script lang="ts">
type CreateCourseOptions = {
    type: "LK" | "GK" | "single-class" | "out-of-class";
    teacher: string[];
    subject: string;
    schoolYear: number;
    semester: 0 | 2 | 1;
    grade: number;
    number?: number;
    linkedTuts?: [string];
};

export default {
    data(): {
        course: CreateCourseOptions;
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
                teacher: Array<string>(),
                subject: "",
                schoolYear: 0,
                semester: 0,
                grade: 5,
                type: "LK",
                linkedTuts: undefined as [string] | undefined,
                number: undefined as number | undefined,
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
                body: this.course,
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
        <VAlert v-if="error" type="error">
            {{ error }}
        </VAlert>
        <VCard>
            <VCardTitle> Generelles </VCardTitle>
            <VCardText>
                <VSelect
                    v-model="course.type"
                    :items="['LK', 'GK', 'single-class', 'out-of-class']"
                    label="Kurstyp"
                    :rules="[rules.required]"
                />
                <VSelect
                    v-model="course.schoolYear"
                    :items="[...Array(13).keys()].map((i) => i + 5)"
                    label="Jahrgang"
                    :rules="[rules.required]"
                />
                <VSelect
                    v-model="course.semester"
                    :items="[0, 1, 2]"
                    label="Semester"
                    :rules="[rules.required]"
                />
                <VSelect
                    v-model="course.grade"
                    :items="[...Array(13).keys()].map((i) => i + 1)"
                    label="Kursstufe"
                    :rules="[rules.required]"
                />
                <VTextField
                    v-if="course.type === 'single-class'"
                    v-model="course.number"
                    label="Kursnummer"
                    :rules="[rules.required]"
                />
                <!-- todo -->
                <!-- <VSelect
                    v-if="course.type === 'out-of-class'"
                    v-model="course.linkedTuts"
                    :items="['5', '6', '7', '8', '9', '10', '11', '12', '13']"
                    label="Verknüpfte Tutorenkurse"
                    :rules="[rules.required]"
                    multiple
                /> -->
            </VCardText>
        </VCard>
        <br />
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
                    v-model="course.teacher"
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

