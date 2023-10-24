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
        createdUserPwd?: string;
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
            createdUserPwd: undefined,
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
        async createUser() {
            const res = await useFetch("/api/admin/users", {
                method: "POST",
                body: JSON.stringify({
                    fullName: this.fullName,
                    username: this.username,
                    type: this.type,
                }),
            });
            if (res.status.value === "success" && res.data.value) {
                this.createdUserPwd = res.data.value.pwd as string;
                this.btn.color = "success";
                this.btn.text = "Erfolgreich";
            } else {
                this.createdUserPwd = undefined;
                this.btn.color = "error";
                this.btn.text = "Fehler";
            }
        },
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
        <VBtn
            :loading="btn.loading"
            :disabled="btn.disabled"
            :color="btn.color"
            type="submit"
            >{{ btn.text }}</VBtn
        >
        <VSpacer></VSpacer>
        <VTextField
            v-if="createdUserPwd"
            :value="createdUserPwd"
            readonly
            label="Passwort des erstellten Benutzers"
        />
    </VForm>
</template>
