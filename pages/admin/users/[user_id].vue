<script lang="ts">
interface IUser {
    id: string;
    username: string;
    fullName: string;
    type: "student" | "teacher" | "parent";
    mfaEnabled: boolean;
    parents?: string[]; // Schüler only
    kuezel?: string; // Lehrkraft only
}

export default {
    async beforeCreate() {
        await checkAuth({
            redirectOnMfaRequired: true,
            throwErrorOnNotAuthenticated: true,
            redirectOnPwdChange: true,
        });
    },
    async beforeMount() {
        const userId = this.$route.params.user_id;
        const res = await useFetch(`/api/admin/users/${userId}`, {
            method: "GET",
        });
        if (res.status.value === "success" && res.data.value) {
            this.user = res.data.value as IUser;
        } else {
            this.error.show = true;
            this.error.message = "Fehler beim Laden des Benutzers";
        }
    },
    data() {
        return {
            error: {
                show: false,
                message: "",
            },
            user: {} as IUser,
        };
    },
    methods: {
        async deleteUser() {
            const res = await useFetch(`/api/admin/users/${this.user.id}`, {
                method: "DELETE",
            });
            if (res.status.value === "success" && res.data.value) {
                navigateTo("/admin/users");
            } else {
                this.error.show = true;
                this.error.message = "Fehler beim Löschen des Benutzers";
            }
        },
        async saveUser() {},
    },
};
</script>

<template>
    <VAlert v-if="error.show" title="Fehler" type="error" :text="error.message" />
    <VForm @submit.prevent="saveUser">
        <VCard>
            <VCardTitle>Benutzer {{ user.username }}</VCardTitle>
            <VCardText>
                <VTextField label="Voller Name" v-model="user.fullName" />
                <VTextField label="Benutzername" v-model="user.username" />
                <VSelect
                    label="Typ"
                    :items="['student', 'teacher', 'parent']"
                    v-model="user.type"
                />
                <VTextField label="Kürzel" v-model="user.kuezel" v-if="user.type === 'teacher'" />
                <VCheckbox label="2FA aktiviert" v-model="user.mfaEnabled" readonly />
            </VCardText>
            <VCardText v-if="user.type === 'student'">
                <VBtn
                    link
                    :href="'/admin/users/' + parent"
                    :key="i"
                    v-for="(parent, i) in user.parents"
                    >Elternteil {{ i + 1 }}</VBtn
                >
                <!-- TODO -->
                <!-- textfield with ASMSQ to add parents -->
            </VCardText>
            <VCardActions>
                <VBtn variant="flat" type="submit" color="primary">Änderungen speichern</VBtn>
                <VBtn link href="/admin/users">Änderungen verwerfen</VBtn>
                <VBtn variant="flat" color="error" @click="deleteUser">Benutzer löschen</VBtn>
            </VCardActions>
        </VCard>
    </VForm>
</template>
