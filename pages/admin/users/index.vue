<script lang="ts">
export default {
    data(): {
        users: {
            type: "student" | "teacher" | "parent";
            name: string;
            id: string;
            tutName?: string;
        }[];
        searchQuery: string;
        error: {
            show: boolean;
            msg: string;
        };
    } {
        return {
            users: [],
            searchQuery: "",
            error: {
                show: false,
                msg: "",
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
    beforeMount() {
        this.search();
    },
    methods: {
        async search() {
            const res = await useFetch(
                `/api/admin/users?s=${encodeURIComponent(this.searchQuery)}`,
                {
                    method: "GET",
                },
            );
            if (res.status.value === "success") {
                this.users = res.data.value?.users as Array<{
                    type: "student" | "teacher" | "parent";
                    name: string;
                    id: string;
                    tutName?: string;
                }>;
            } else {
                this.error = {
                    show: true,
                    msg: "Keine Benutzer gefunden",
                };
            }
        },
    },
};
</script>

<template>
    <VTextField
        v-model="searchQuery"
        label="User search"
        dense
        outlined
        hide-details
        @change="search"
    >
        <template #append>
            <VBtn
                title="create user"
                link
                to="/admin/users/create"
                prepend-icon="mdi-plus"
                color="primary"
                style="z-index: 1024"
            >
                Create
            </VBtn>
        </template>
    </VTextField>
    <VTable style="margin-top: 6px">
        <thead>
            <tr>
                <th>Typ</th>
                <th>Name</th>
                <th>Tut-Kurs/ Klasse</th>
            </tr>
        </thead>
        <tbody>
            <tr @click="navigateTo(`/admin/users/${user.id}`)" v-for="user in users" :key="user.id">
                <td style="display: flex; flex-direction: row; align-items: center; gap: 12px">
                    <VIcon v-if="user.type == 'student'"> mdi-account </VIcon>
                    <p v-if="user.type == 'student'">Schüler</p>
                    <VIcon v-else-if="user.type == 'teacher'"> mdi-account-tie </VIcon>
                    <p v-if="user.type == 'teacher'">Lehrkraft</p>
                    <VIcon v-else-if="user.type == 'parent'"> mdi-account-child </VIcon>
                    <p v-if="user.type == 'parent'">Elternteil</p>
                </td>
                <td>{{ user.name }}</td>
                <td>{{ user.tutName }}</td>
            </tr>
        </tbody>
    </VTable>
    <VAlert style="margin: 6px" type="error" variant="flat" v-if="error.show" :title="error.msg" />
</template>
