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
        async deleteUser() {},
        async saveUser() {},
    },
};
</script>

<template>
    <VAlert title="Fehler" type="error" :text="error.message" />
    <VForm @submit.prevent="saveUser">
        <VCard>
            <VCardTitle>Benutzer {{ user.username }}</VCardTitle>
            <VCardText>
                <VTextField label="Voller Name" :v-model="user.fullName" />
                <VTextField label="Benutzername" :v-model="user.username" />
                <VSelect
                    label="Typ"
                    :items="['studen', 'teacher', 'parent']"
                    :v-model="user.type"
                />
                <VTextField label="Kürzel" :v-model="user.kuezel" v-if="user.type === 'teacher'" />
                <VCheckbox label="2FA aktiviert" :v-model="user.mfaEnabled" readonly />
            </VCardText>
            <VCardText v-if="user.type === 'student'">
                <VBtn
                    link
                    :href="'/admin/user/' + parent"
                    :key="i"
                    v-for="(parent, i) in user.parents"
                    >Elternteil {{ i + 1 }}</VBtn
                >
            </VCardText>
            <VCardActions>
                <VBtn type="submit" color="primary">Änderungen speichern</VBtn>
                <VBtn type="reset">Änderungen verwerfen</VBtn>
                <VBtn @click="deleteUser">Benutzer löschen</VBtn>
            </VCardActions>
        </VCard>
    </VForm>
</template>
