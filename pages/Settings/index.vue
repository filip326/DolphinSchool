<script lang="ts">
export default {
    data() {
        return {
            settings: [
                {
                    name: "Persönliche Einstellungen",
                    link: "/settings/me"
                },
                {
                    name: "Persönliche Einstellungen",
                    link: "/settings/me"
                },
                {
                    name: "Persönliche Einstellungen",
                    link: "/settings/me"
                },
                {
                    name: "Persönliche Einstellungen",
                    link: "/settings/me"
                },
                {
                    name: "Persönliche Einstellungen",
                    link: "/settings/me"
                },
                {
                    name: "Persönliche Einstellungen",
                    link: "/settings/me"
                },
                {
                    name: "Persönliche Einstellungen",
                    link: "/settings/me"
                },
                {
                    name: "Persönliche Einstellungen",
                    link: "/settings/me"
                }
            ]
        };
    }
};
</script>

<template>
    <h2><VIcon>mdi-cogs</VIcon>Einstellungen</h2>
    <div class="settings__wrapper">
        <VCard v-for="(setting, index) in settings" :key="index">
            <VCardTitle>
                {{ setting.name }}
            </VCardTitle>
            <VCardActions>
                <VSpacer />
                <VBtn prepend-icon="mdi-open-in-new" variant="outlined"> Öffnen </VBtn>
            </VCardActions>
        </VCard>
    </div>
</template>

<style scoped>
@import url("../../assets/settings.css");
</style>
