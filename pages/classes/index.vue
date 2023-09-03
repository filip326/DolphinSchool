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
            <VTab value="myclass" prepend-icon="mdi-account-group">Meine Klasse</VTab>
            <VTab value="mycourses" prepend-icon="mdi-account-multiple">Meine Kurse</VTab>
        </VTabs>
        <VWindow v-model="tab">
            <VWindowItem value="myclass"></VWindowItem>
            <VWindowItem value="mycourses"></VWindowItem>
        </VWindow>
    </VCard>
</template>

<style scoped>
.v-icon {
    margin: 12px;
}
</style>
