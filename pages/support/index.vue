<script lang="ts">
definePageMeta({
    layout: "login",
});
export default {
    data() {
        return {
            rules: {
                // required
                required: (v: string) => !!v || "Dieses Feld ist erforderlich",
            },
            error: {
                shown: false,
                message: "",
            },
            fastProblemRecognitionItems: [
                { title: "Passwort vergessen", descr: "Mein Passwort muss zurückgesetzt werden." },
                {
                    title: "Login-Probleme",
                    descr: "Ich kann mich nicht anmelden.",
                },
                { title: "Hilfe", descr: "Ich brauche Hilfe bei der Orientierung." },
                {
                    title: "Fehlermeldung",
                    descr: "Ich habe eine Fehlermeldung, welche immer wieder auftritt.",
                },
                {
                    title: "Entwicklungsfehler",
                    descr: "Ich habe einen Bug oder eine Sicherheitslücke entdeckt.",
                },
                { title: "Sonstiges", descr: "Mein Problem kann nicht kategorisiert werden." },
            ] as { title: string; descr: string }[],
            supportData: {
                fullName: "",
                fastProblemRecognition: {
                    title: "Sonstiges",
                    descr: "Mein Problem kann nicht kategorisiert werden",
                },
                problemDescription: "",
            },
        };
    },
};
</script>

<template>
    <div class="loginform">
        <VForm>
            <VAlert v-if="error.shown" type="error" variant="text" :text="error.message" />
            <h1>Ticket erstellen</h1>
            <VTextField
                v-model="supportData.fullName"
                label="Vollständiger Name"
                hint="Ihr vollständiger Name"
                :rules="[rules.required]"
            />
            <VSelect
                v-model="supportData.fastProblemRecognition"
                label="Kateogoriesierung des Problems"
                :items="fastProblemRecognitionItems"
                item-text="title"
                item-value="descr"
                :hint="supportData.fastProblemRecognition.descr"
                :rules="[rules.required]"
                persistent-hint
                return-object
                single-line
            />
            <VTextarea
                v-model="supportData.problemDescription"
                label="Beschreibung des Problems"
                hint="Beschreiben Sie Ihr Problem möglichst genau."
                :rules="[rules.required]"
                rows="1"
                auto-grow
                row-height="20"
                density="compact"
            />
            <VBtn type="submit" size="large" variant="outlined">Erstellen</VBtn>
            <NuxtLink to="/support/open">Ich habe bereits ein Ticket</NuxtLink>
        </VForm>
        <div>
            <h1>Support Ablauf</h1>
        </div>
    </div>
</template>

<style scoped>
@import url("../../assets/login.css");
</style>
