<script lang="ts">
export default {
    data() {
        return {
            rules: {
                required: (v: any) => !!v || "Dieses Feld ist erforderlich!",
            },
            error: {
                shown: false,
                message: "",
            },
            form: {
                type: "-" as "-" | "email" | "pwa" | "discord",
                email: undefined as string | undefined,
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
};
</script>

<template>
    <div class="settings_form">
        <section class="settings_info">
            <div>
                <h1>Mail-Weiterleitung</h1>
                <div>
                    <p>
                        Stellen Sie Ihre Weiterleitung ein, um Ihre Mails und
                        Benachrichtigungen an eine der folgenden Optionen weiterzuleiten:
                    </p>
                    <ul>
                        <li>
                            <b>Externe E-Mail-Adresse</b> - Ihre Mails werden an eine
                            externe E-Mail-Adresse weitergeleitet.
                        </li>
                        <li>
                            <b>PWA</b> - Sie erhalten bei erhalt einer Mail eine
                            Push-Benachrichtigung auf Ihrem Gerät.
                        </li>
                        <li>
                            <b>Discord</b> - Ihre Mails werden via Discord an Sie
                            weitergeleitet.
                        </li>
                    </ul>
                    <div>
                        <p>
                            <b>Wichtig:</b> Der Inhalt der Mails wird bei folgenden
                            Optionen aus Sicherheitsgründen nicht weitergeleitet:
                        </p>
                        <ul>
                            <li>Discord</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        <VForm @submit.prevent="">
            <VAlert
                v-if="error.shown"
                type="error"
                variant="text"
                :text="error.message"
            />

            <VSelect
                v-model="form.type"
                :rules="[rules.required]"
                :items="[
                    { value: '-', label: 'Nicht weiterleiten' },
                    { value: 'email', label: 'E-Mail' },
                    { value: 'pwa', label: 'PWA' },
                    { value: 'discord', label: 'Discord' },
                ]"
                item-title="label"
                item-value="value"
                label="Weiterleitungsart"
                name="type"
                outlined
            />

            <VTextField
                v-if="form.type === 'email'"
                v-model="form.email"
                :rules="[rules.required]"
                label="Externe E-Mail-Adresse"
                name="email"
                type="email"
                outlined
            />

            <VBtn type="submit" color="primary" class="mr-4">Änderungen bestätigen</VBtn>
            <VBtn to="/settings" color="error">Zurück</VBtn>
        </VForm>
    </div>
</template>

<style scoped>
.settings_form {
    padding: 20px;
}
</style>
