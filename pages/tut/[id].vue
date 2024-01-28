<script lang="ts">
definePageMeta({
    layout: "default",
});

type Student = {
    name: string;
    id: string;
};

export default {
    data(): {
        openTab: "main" | "students";
        loadingState: "loading" | "done" | "error";
        courseName: string;
        courseTeacher: string;
        courseViceTeacher?: string;

        students?: Student[];
    } {
        return {
            openTab: "main",
            loadingState: "loading",
            courseName: "",
            courseTeacher: "",
            courseViceTeacher: undefined,
            students: undefined,
        };
    },

    async beforeCreate() {
        const courseId = this.$route.params.id;

        try {
            const response = await useFetch(`/api/tut/${courseId}`, {
                method: "GET",
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
    methods: {
        async loadStudentsList() {
            if (this.students !== undefined) {
                return;
            }
            const courseId = this.$route.params.id;

            try {
                const response = await useFetch(`/api/tut/${courseId}/students`, {
                    method: "GET",
                });
                if (response.status.value === "success") {
                    const data = await response.data.value;
                    this.students = data ?? [];
                }
            } catch {
                this.loadingState = "error";
            }
        },
    },
};
</script>

<template>
    <VCard v-if="loadingState === 'done'">
        <VCardTitle> Klasse/Tut-Kurs {{ courseName }} </VCardTitle>
        <VCardText>
            <VTabs v-model="openTab">
                <VTab value="main"> Infos </VTab>
                <VTab value="students" @click="loadStudentsList"> Schüler*innen </VTab>
            </VTabs>
            <VWindow v-model="openTab">
                <VWindowItem value="main">
                    <h3>Lehrkraft</h3>
                    <p><VIcon>mdi-human-male-board</VIcon> {{ courseTeacher }}</p>
                    <template v-if="courseViceTeacher">
                        <h4>Vertretungslehrkraft</h4>
                        <p><VIcon>mdi-teacher</VIcon> {{ courseViceTeacher }}</p>
                    </template>
                </VWindowItem>
                <VWindowItem value="students">
                    <h3>Schülerinnen und Schüler</h3>
                    <template v-if="students == undefined">
                        <VProgressCircular indeterminate></VProgressCircular>
                    </template>
                    <template v-else-if="students.length === 0">
                        <p>
                            Keine Schülerinnen und Schüler in der Klasse/im Kurs
                            {{ courseName }}
                        </p>
                    </template>
                    <template v-else>
                        <p>
                            Schülerinnen und Schüler in der Klasse/im Kurs
                            {{ courseName }}
                        </p>
                        <VList>
                            <VListItem v-for="student in students" :key="student.id">
                                <VListItemIcon>
                                    <VIcon>mdi-account</VIcon>
                                </VListItemIcon>
                                <VListItemText>{{ student.name }}</VListItemText>
                            </VListItem>
                        </VList>
                    </template>
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

<style scoped>
.v-window-item {
    padding: 5px;
}
</style>
