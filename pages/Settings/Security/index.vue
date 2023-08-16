<template>
    <div class="settings__wrapper">
        <VCard>
            <VCardTitle>
                Passwort
            </VCardTitle>
            <VCardSubtitle>
                Password ändern
            </VCardSubtitle>
            <VCardActions>
                <VSpacer />
                <VBtn variant="outlined">Ändern</VBtn>
            </VCardActions>
        </VCard>

        <VCard>
            <VCardTitle>
                Zwei-Faktor-Authentifizierung
            </VCardTitle>
            <VCardSubtitle>
                Erweitern Sie die Sicherheit Ihres Kontos durch eine Zwei-Faktor-Authentifizierung
            </VCardSubtitle>
            <VCardActions>
                <VSpacer />
                <VBtn variant="outlined">Aktivieren</VBtn>
            </VCardActions>
        </VCard>
    </div>
</template>

<style scoped>
@import url("../../../assets/settings.css");
</style>
