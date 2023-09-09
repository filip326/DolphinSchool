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
            blockedPwd: undefined as string | undefined,
        };
    },
    async beforeMount() {
        await this.updatePwdList();
    },
    methods: {
        async updatePwdList() {
            // todo
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async unblockPwd(pwd: string) {
            // todo
        },
        async createPwd() {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const pwd = this.blockedPwd;
            // todo
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
                    :rules="[
                        (v) => {
                            // is required
                            if (!v) return 'Bitte einen ReqExp eingeben.';
                        },
                    ]"
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
