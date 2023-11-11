<script lang="ts">
export default {};
</script>

<template>
    <VCard>
        <VCardTitle>passwordless Login</VCardTitle>
        <VCardText>
            <VAlert
                type="error"
                variant="text"
                text="Der passwordless Login ist nicht verfügbar."
            />
            <p>
                Auf diesem Gerät ist der passwordless Login nicht verfügbar oder du hast
                noch keinen passwordless Login eingerichtet. Bitte nutzen Sie die
                Anmeldung mit Benutzername und Passwort.
            </p>
        </VCardText>
    </VCard>
</template>
