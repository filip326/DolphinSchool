<script lang="ts">
export default {
    async beforeCreate() {
        const checkAuthResult = await checkAuth({
            redirectOnMfaRequired: true,
            redirectOnPwdChange: true,
            throwErrorOnNotAuthenticated: true,
        });

        if (checkAuthResult.user.type !== "teacher") {
            throw createError({ statusCode: 403, statusMessage: "Forbidden" });
        }
    },
    data() {
        return {
            tab: "myclass",
            selectedCourseId: undefined as number | undefined,
            selectedCourse: undefined as
                | {
                      name: string;
                      students: Array<{ name: string; email: string }>;
                  }
                | undefined,
            courses: [
                {
                    name: "",
                    students: Array<{ name: string; email: string }>(),
                },
            ],
            myClass: {
                name: "",
                students: Array<{ name: string; email: string }>(),
            },
        };
    },
};
</script>

<template>
    <h2><VIcon>mdi-school</VIcon>Klassen- und Kurssystem</h2>
    <VCard>
        <VTabs
            v-model="tab"
            center-active
            next-icon="mdi-arrow-right-bold-box-outline"
            bg-color="primary"
            prev-icon="mdi-arrow-left-bold-box-outline"
            show-arrows
            slider-color="#fff"
            density="compact"
        >
            <VTab v-if="myClass" value="myclass" prepend-icon="mdi-account-group"
                >Meine Klasse</VTab
            >
            <VTab value="mycourses" prepend-icon="mdi-account-multiple">Meine Kurse</VTab>
        </VTabs>
        <VWindow v-model="tab">
            <VWindowItem value="myclass">
                <h3>{{ myClass?.name }}</h3>
                <VList>
                    <VListItem v-for="student in myClass.students" :key="student.name">
                        <VListItemTitle>{{ student.name }}</VListItemTitle>
                        <VListItemSubtitle>{{ student.email }}</VListItemSubtitle>
                    </VListItem>
                </VList>
            </VWindowItem>
            <VWindowItem value="mycourses">
                <div class="course__wrapper">
                    <VCard
                        @click="selectedCourseId = i"
                        v-for="(course, i) in courses"
                        :key="course.name"
                    >
                        <VCardTitle>{{ course.name }}</VCardTitle>
                        <VCardSubtitle
                            >{{ course.students.length }} Schüler u. Schüler</VCardSubtitle
                        >
                    </VCard>
                </div>
            </VWindowItem>
            <VWindowItem value="seecourse">
                <!-- same look like "myclass" -->
                <h3>{{ selectedCourse?.name }}</h3>
                <VList>
                    <VListItem v-for="student in selectedCourse?.students" :key="student.name">
                        <VListItemTitle>{{ student.name }}</VListItemTitle>
                        <VListItemSubtitle>{{ student.email }}</VListItemSubtitle>
                    </VListItem>
                </VList>
            </VWindowItem>
        </VWindow>
    </VCard>
</template>

<style scoped>
.v-icon {
    margin: 12px;
}

.course__wrapper {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 500px));
    gap: 10px;
}
</style>
