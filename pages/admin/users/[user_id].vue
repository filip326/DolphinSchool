<script lang="ts">
interface IUser {
    id: string;
    username: string;
    fullName: string;
    type: "student" | "teacher" | "parent";
    mfaEnabled: boolean;
    parents?: string[]; // Schüler only
    kuezel?: string; // Lehrkraft only
    permissions?: {
        [key: string]: boolean;
    };
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
            console.info(JSON.stringify(this.user));
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
    },
};
</script>

<template>
    <VAlert v-if="error.show" title="Fehler" type="error" :text="error.message" />
    <VCard>
        <VCardTitle>Benutzer {{ user.username }}</VCardTitle>
        <VCardText>
            <VTextField label="Voller Name" v-model="user.fullName" readonly />
            <VTextField label="Benutzername" v-model="user.username" readonly />
            <VSelect
                label="Typ"
                :items="['student', 'teacher', 'parent']"
                v-model="user.type"
                readonly
            />
            <VTextField
                label="Kürzel"
                v-model="user.kuezel"
                v-if="user.type === 'teacher'"
                readonly
            />
            <VCheckbox label="2FA aktiviert" v-model="user.mfaEnabled" readonly />
            <VExpansionPanels v-if="Object.keys(user.permissions ?? {}).length !== 0">
                <VExpansionPanel title="Berechtigungen">
                    <template #text>
                        <div class="permission-checkboxes">
                            <VCheckbox
                                v-for="permission in Object.keys(user.permissions!)"
                                class="permission-checkbox"
                                :label="permission"
                                :key="permission"
                                :value="user.permissions![permission]"
                                readonly
                            />
                        </div>
                    </template>
                </VExpansionPanel>
            </VExpansionPanels>
        </VCardText>
        <VCardText v-if="user.type === 'student'">
            <VBtn link :href="'/admin/users/' + parent" :key="i" v-for="(parent, i) in user.parents"
                >Elternteil {{ i + 1 }}
            </VBtn>
            <!-- TODO -->
            <!-- textfield with ASMSQ to add parents -->
        </VCardText>
        <VCardActions>
            <VBtn variant="flat" link to="/admin/users" color="primary">Zurück</VBtn>
            <VBtn variant="flat" color="error" @click="deleteUser">Benutzer löschen</VBtn>
        </VCardActions>
    </VCard>
</template>

<style>
.permission-checkboxes {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto;
}
.permission-checkbox {
    margin: 0;
}
.permission-checkboxes .v-input__details {
    display: none;
    height: 0px;
}
</style>
