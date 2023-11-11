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
        const response = await useFetch("/api/permissions/CHANGE_USER_PASSWORD", {
            method: "GET",
        });
        this.passwordChangeAllowed =
            response.status.value === "success" && response.data.value;
    },
    data(): {
        error: {
            show: boolean;
            message: string;
        };
        passwordChangeAllowed: boolean | null;
        passwordChange: {
            show_password: boolean;
            show_confirmation_dialog: boolean;
            password: string;
            loading_new_password: boolean;
        };
        user: IUser;
    } {
        return {
            error: {
                show: false,
                message: "",
            },
            passwordChangeAllowed: null,
            user: {} as IUser,
            passwordChange: {
                show_password: false,
                password: "",
                loading_new_password: false,
                show_confirmation_dialog: false,
            },
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
        async updatePermission(permission: string) {
            if (!this.user.permissions || !(permission in this.user.permissions!)) {
                return;
            }
            if (this.user.permissions[permission] === true) {
                // grant permission
                const res = await useFetch(
                    `/api/admin/users/${this.user.id}/permissions/${permission}`,
                    { method: "POST" }, // post to add permission
                );

                if (res.status.value === "success" && res.data.value?.success === true) {
                    return;
                } else {
                    // change checkbox back to false if permission could not be granted
                    this.user.permissions[permission] = false;
                }
            } else {
                // revoke permission
                const res = await useFetch(
                    `/api/admin/users/${this.user.id}/permissions/${permission}`,
                    { method: "DELETE" }, // delete to revoke permission
                );
                if (res.status.value === "success" && res.data.value?.success === true) {
                    return;
                } else {
                    // change checkbox back to true if permission could not be revoked
                    this.user.permissions[permission] = true;
                }
            }
        },
        async changePassword() {
            // first, set loading to true
            this.passwordChange.loading_new_password = true;
            // now, request a new password
            const response = await useFetch(`/api/admin/users/${this.user.id}/password`, {
                method: "get",
            });
            if (response.status.value === "success" && response.data.value) {
                // if the request was successful, show the password to the user
                this.passwordChange.show_password = true;
                this.passwordChange.password = response.data.value.password;
            } else {
                // if the request was not successful, show an error
                this.finishPasswordChange();
                this.passwordChange.loading_new_password = false;
                this.error.show = true;
                this.error.message = "Fehler beim Generieren des Passworts";
            }
        },
        finishPasswordChange() {
            // hide the password dialog
            // reset the password
            this.passwordChange.show_password = false;
            this.passwordChange.loading_new_password = false;
            this.passwordChange.show_confirmation_dialog = false;
            this.passwordChange.password = "";
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
                                v-model="user.permissions![permission]"
                                @update:model-value="updatePermission(permission)"
                            />
                        </div>
                    </template>
                </VExpansionPanel>
                <VExpansionPanel title="Anmeldung" v-if="passwordChangeAllowed">
                    <template #text>
                        <VBtn color="primary" prepend-icon="mdi-key">
                            <VDialog
                                activator="parent"
                                v-model="passwordChange.show_confirmation_dialog"
                            >
                                <VCard>
                                    <VCardTitle>
                                        Neues Passwort für {{ user.username }}
                                    </VCardTitle>
                                    <VCardText>
                                        Wollen Sie wirklich ein neues Passwort für
                                        {{ user.username }} generieren? Das alte Passwort
                                        wird dadurch ungültig. Erstellen Sie nur dann ein
                                        neues Passwort, wenn der Benutzer sein Passwort
                                        vergessen hat oder es kompromittiert wurde.
                                    </VCardText>
                                    <VCardActions>
                                        <VBtn
                                            color="primary"
                                            @click="changePassword"
                                            :loading="passwordChange.loading_new_password"
                                            >Passwort ändern</VBtn
                                        >
                                        <VBtn
                                            color="error"
                                            :disabled="
                                                passwordChange.loading_new_password
                                            "
                                            >Abbrechen</VBtn
                                        >
                                    </VCardActions>
                                </VCard>
                            </VDialog>
                            Passwort ändern
                        </VBtn>
                    </template>
                </VExpansionPanel>
                <VExpansionPanel title="JSON">
                    <template #text>
                        <pre>{{ JSON.stringify(user, null, 4) }}</pre>
                    </template>
                </VExpansionPanel>
            </VExpansionPanels>
        </VCardText>
        <VCardText v-if="user.type === 'student'">
            <VBtn
                link
                :href="'/admin/users/' + parent"
                :key="i"
                v-for="(parent, i) in user.parents"
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
    <VDialog v-model="passwordChange.show_password">
        <VCard>
            <VCardTitle> Neues Passwort für {{ user.username }}: </VCardTitle>
            <VCardText>
                <VTextField label="Passwort" readonly v-model="passwordChange.password" />
                Der Nutzer kann sich mit diesem Passwort anmelden. Nach der Anmeldung muss
                der Nutzer das Passwort ändern.
            </VCardText>
            <VCardActions>
                <VBtn color="primary" @click="finishPasswordChange">Schließen</VBtn>
            </VCardActions>
        </VCard>
    </VDialog>
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
/* .permission-checkboxes .v-input__details {
    display: none;
    height: 0px;
} */
</style>
