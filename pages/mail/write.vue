<script lang="ts">
export default {
    data() {
        return {
            absender: "Du",
            empfaenger: [] as string[],
            content: "",
            subject: "",
            rules: {
                required: (value: string) => !!value || "Dieses Feld ist erforderlich",
            },
            error: {
                shown: false,
                message: "",
            },
        };
    },
    methods: {
        setEmpf(users: string[]) {
            this.empfaenger = users;
        },
        setContent(content: string) {
            this.content = content;
        },
        async sendMail() {
            if (!this.empfaenger || !this.subject || !this.content) {
                this.error = {
                    shown: true,
                    message: "Bitte füllen Sie alle Felder aus",
                };
                return;
            }

            const res = await useFetch("/api/mail", {
                method: "POST",
                body: JSON.stringify({
                    sendTo: this.empfaenger.map((e) => `${e}`),
                    subject: this.subject,
                    content: this.content,
                }),
            });

            if (res.status.value != "success") {
                console.log(res.error.value);
                this.error = {
                    shown: true,
                    message: "Nachricht konnte nicht gesendet werden",
                };
            } else {
                await navigateTo("/mail");
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
    <VForm @submit.prevent="sendMail">
        <VCard>
            <VCardTitle> Nachricht schreiben </VCardTitle>

            <VCardText>
                <VForm>
                    <VTextField label="Absender" readonly v-model="absender" />

                    <ASMSQSearchField label="Empfänger" @user-ids="setEmpf" />

                    <VTextField
                        :rules="[rules.required]"
                        label="Betreff"
                        v-model="subject"
                    />

                    <MarkdownEditor @md-model="setContent" />

                    <!-- <VFileInput label="Anhang (max 5 MB)" /> -->
                </VForm>
            </VCardText>

            <VAlert
                v-if="error.shown"
                type="error"
                title="Fehler"
                :text="error.message"
            />

            <VCardActions>
                <VBtn to="/mail" prepend-icon="mdi-trash-can" variant="outlined">
                    Verwerfen
                </VBtn>
                <VSpacer />
                <!-- <VBtn prepend-icon="mdi-content-save" variant="outlined">
                    Speichern
                </VBtn> -->
                <VBtn type="submit" prepend-icon="mdi-send" variant="outlined">
                    Senden
                </VBtn>
            </VCardActions>
        </VCard>
    </VForm>
</template>

<style scoped>
.v-btn {
    padding: 0px 20px;
}
</style>
