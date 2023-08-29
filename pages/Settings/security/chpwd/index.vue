<script>
export default {
    data() {
        return {
            old_pwd: "",
            new_pwd: "",
            rules: {
                required: (v) => !!v || "Dieses Feld ist erforderlich!",
                wiederholen: (v) => v === this.new_pwd || "Die Passwörter stimmen nicht überein!",
                notsame: (v) => v !== this.old_pwd || "Das neue Passwort muss sich vom alten unterscheiden!",
                password: (v) => {
                    if (v.length < 10) {
                        return "Das Passwort muss mindestens 10 Zeichen lang sein!";
                    }
                    if (!/[a-z]/.test(v)) {
                        return "Das Passwort muss mindestens einen Kleinbuchstaben (a-z) enthalten!";
                    }
                    if (!/[A-Z]/.test(v)) {
                        return "Das Passwort muss mindestens einen Großbuchstaben (A-Z) enthalten!";
                    }
                    if (!/[0-9]/.test(v)) {
                        return "Das Passwort muss mindestens eine Ziffer (0-9) enthalten!";
                    }
                },
            },
            error: {
                shown: false,
                message: "",
            },
        };
    },
    methods: {
        async changePassword() {
            const response = await useFetch("/api/setup/pwd/change", {
                method: "POST",
                body: JSON.stringify({
                    oldPassword: this.old_pwd,
                    newPassword: this.new_pwd,
                }),
            });

            if (!response.data.value || response.error.value) {
                if (response.error.value.statusCode === 200) {
                    await navigateTo("/home");
                    return;
                }

                this.error.shown = true;
                this.error.message =
                    response.error.statusCode === 400 ? "Ungültiges Passwort" : "Passwort ändern fehlgeschlagen!";
            }

            if (response.data.value.success) {
                await navigateTo("/home");
                return;
            } else {
                this.error.shown = true;
                this.error.message = "Das Passwort konnte nicht geändert werden!";
            }
        },
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
                <h1>Passwort ändern</h1>
                <div>
                    <p>
                        Beachten Sie die folgenden Regeln für Ihres Passwort. Sie können Ihr Passwort jederzeit in den
                        Einstellungen ändern.
                    </p>
                </div>
                <ul>
                    <li>Das Passwort muss mindestens 10 Zeichen lang sein.</li>
                    <li>Das Passwort muss mindestens einen Kleinbuchstaben (a-z) enthalten.</li>
                    <li>Das Passwort muss mindestens einen Großbuchstaben (A-Z) enthalten.</li>
                    <li>Das Passwort muss mindestens eine Ziffer (0-9) enthalten.</li>
                </ul>
                <div>
                    <p>
                        Es wird empfohlen neben einem sicherem Passwort die Zwei-Faktor-Authentifizierung in den
                        Einstellungen zu aktivieren. Weitere Informationen finden Sie beispielsweise auf der
                        <a
                            href="https://www.bsi.bund.de/DE/Themen/Verbraucherinnen-und-Verbraucher/Informationen-und-Empfehlungen/Cyber-Sicherheitsempfehlungen/Accountschutz/Sichere-Passwoerter-erstellen/sichere-passwoerter-erstellen_node.html"
                        >
                            Website des BSI
                        </a>
                    </p>
                </div>
            </div>
        </section>

        <VForm @submit.prevent="changePassword()">
            <VAlert v-if="error.shown" type="error" variant="text" :text="error.message" />

            <p>
                Geben Sie Ihr bisheriges Passwort ein. Wählen Sie anschließend ein neues Passwort und wiederholen Sie
                dieses.
            </p>

            <VTextField v-model="old_pwd" label="bisheriges Passwort" type="password" :rules="[rules.required]" />
            <VTextField
                v-model="new_pwd"
                label="neues Passwort"
                type="password"
                :rules="[rules.required, rules.notsame, rules.password]"
            />
            <VTextField
                label="Passwort wiederholen"
                type="password"
                :rules="[rules.required, rules.wiederholen, rules.password]"
            />

            <VBtn type="submit" color="primary" class="mr-4">Passwort ändern</VBtn>
        </VForm>
    </div>
</template>

<style scoped>
@import url("../../../../assets/settings.css");
</style>
