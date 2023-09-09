<script lang="ts">
export default {
    async beforeCreate() {
        await checkAuth({
            redirectOnMfaRequired: true,
            throwErrorOnNotAuthenticated: true,
            redirectOnPwdChange: true,
        });
    },
    data() {
        return {
            blockedPwds: [] as string[],
            error: {
                shown: false,
                message: "",
            },
            showCreateDialog: false,
            blockedPwd: "" as string,
            rules: {
                required: (v: string) => !!v || "Dieses Feld ist erforderlich",
            },
        };
    },
    async beforeMount() {
        await this.updatePwdList();
    },
    methods: {
        async updatePwdList() {
            const res = await useFetch("/api/admin/blocked-pwds");
            if (res.status.value === "success") {
                this.blockedPwds = res.data.value as string[];
            } else {
                this.error = {
                    shown: true,
                    message: "Fehler beim Laden der blockierten Passwörter.",
                };
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async unblockPwd(pwd: string) {
            const res = await useFetch("/api/admin/blocked-pwds", {
                method: "DELETE",
                body: JSON.stringify({ pwd }),
            });
            if (res.status.value != "success") {
                this.error = {
                    shown: true,
                    message: "Fehler beim Blocken des Passworts.",
                };
            }
            await this.updatePwdList();
        },
        async createPwd() {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const pwd = this.blockedPwd;
            if (!pwd) return;
            const res = await useFetch("/api/admin/blocked-pwds", {
                method: "POST",
                body: JSON.stringify({ pwd }),
            });
            if (res.status.value === "success") {
                this.showCreateDialog = false;
            } else {
                this.error = {
                    shown: true,
                    message: "Fehler beim Blocken des Passworts.",
                };
            }
            await this.updatePwdList();
        },
    },
};
</script>

<template>
    <VDialog v-model="showCreateDialog">
        <div class="loginform small">
            <VForm @submit.prevent="createPwd()">
                <VAlert v-if="error.shown" type="error" variant="text" :text="error.message" />
                <h1>Passwort blocken</h1>
                <VTextField
                    v-model="blockedPwd"
                    placeholder="/password/i"
                    label="Neues Passwort blocken"
                    hint="Bitte in Form eines RegExp eingeben."
                    :rules="[rules.required]"
                />
                <VBtn type="submit" prepend-icon="mdi-">Hinzufügen</VBtn>
            </VForm>
        </div>
    </VDialog>

    <VList bg-color="background">
        <VListItem variant="tonal" density="comfortable" v-for="pwd in blockedPwds" :key="pwd">
            <VListItemTitle>{{ pwd }}</VListItemTitle>
            <VListItemAction>
                <VBtn icon @click="unblockPwd(pwd)">
                    <VIcon>mdi-delete</VIcon>
                </VBtn>
            </VListItemAction>
        </VListItem>
    </VList>

    <v-btn class="floating_action_button" color="primary" icon="mdi-plus"></v-btn>
</template>

<style scoped>
.floating_action_button {
    position: fixed;
    bottom: 20px;
    right: 20px;
}
</style>
