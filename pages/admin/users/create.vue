<script lang="ts">
export default {
    data(): {
        fullName: string;
        username: string;
        type: "student" | "teacher" | "parent";
        rules: { required: (value: string) => boolean | string };
        btn: {
            loading: boolean;
            text: string;
            disabled: boolean;
            color: string;
        };
    } {
        return {
            fullName: "",
            username: "",
            type: "student",
            rules: {
                required: (value: string) => !!value || "Dieses Feld ist erforderlich",
            },
            btn: {
                loading: false,
                text: "Erstellen",
                disabled: false,
                color: "primary",
            },
        };
    },
    async beforeCreate() {
        await checkAuth({
            redirectOnMfaRequired: true,
            throwErrorOnNotAuthenticated: true,
            redirectOnPwdChange: true,
        });
    },
    methods: {
        async createUser() {},
    },
};
</script>

<template>
    <VForm @submit.prevent="createUser">
        <h1>Benutzer erstellen</h1>
        <VTextField
            v-model="fullName"
            label="Voller Name"
            :rules="[rules.required]"
            required
        ></VTextField>
        <VTextField
            v-model="username"
            label="Benutzername"
            :rules="[rules.required]"
            required
        ></VTextField>
        <VSelect
            v-model="type"
            :items="['student', 'teacher', 'parent']"
            label="Typ"
            required
        ></VSelect>
        <VBtn :loading="btn.loading" :disabled="btn.disabled" :color="btn.color" type="submit">{{
            btn.text
        }}</VBtn>
    </VForm>
</template>
