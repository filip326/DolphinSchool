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
            const res = await useFetch("/api/admin/blocked-pwds", {
                method: "GET",
            });
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
                await this.updatePwdList();
            } else {
                this.error = {
                    shown: true,
                    message: "Fehler beim Blocken des Passworts.",
                };
            }
        },
    },
};
</script>

<template>
    <VDialog v-model="showCreateDialog">
        <div class="loginform small">
            <VForm @submit.prevent="createPwd()">
                <VAlert v-if="error.shown" type="error" :text="error.message" />
                <h1>Passwort blocken</h1>
                <div>
                    Passwörter werden egal ob sie am Ende vom Benutzer groß oder klein
                    geschrieben werden, immer geblockt. Wenn Sie also das Passwort
                    "Dolphin" blockieren möchten, sind unter anderem folgende Passwörter
                    nicht mehr möglich:
                    <ul>
                        <li>dolphin</li>
                        <li>Dolphin</li>
                        <li>DoLpHiNSchool123</li>
                    </ul>
                </div>
                <VTextField
                    v-model="blockedPwd"
                    placeholder="Dolphin"
                    label="Passwort blocken"
                    :rules="[rules.required]"
                />
                <VBtn type="submit" prepend-icon="mdi-">Hinzufügen</VBtn>
            </VForm>
        </div>
    </VDialog>

    <VList bg-color="background">
        <VAlert v-if="error.shown" type="error" :text="error.message" />
        <VListItem
            variant="tonal"
            density="comfortable"
            v-for="pwd in blockedPwds"
            :key="pwd"
        >
            <VListItemTitle>{{ pwd }}</VListItemTitle>
            <VListItemAction>
                <VBtn icon @click="unblockPwd(pwd)">
                    <VIcon>mdi-delete</VIcon>
                </VBtn>
            </VListItemAction>
        </VListItem>
    </VList>

    <VBtn
        @click="showCreateDialog = true"
        class="floating_action_button"
        color="primary"
        icon="mdi-plus"
    ></VBtn>
</template>

<style scoped>
@import url(../../../assets//login.css);
.floating_action_button {
    position: fixed;
    bottom: 20px;
    right: 20px;
}
</style>
