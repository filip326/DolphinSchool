<script lang="ts">
export default {
    async beforeCreate() {
        await checkAuth({
            redirectOnMfaRequired: true,
            redirectOnPwdChange: true,
            throwErrorOnNotAuthenticated: true,
        });
    },
    data() {
        return {
            hasPushNotificationActive: false,
            error: {
                show: false,
                message: "",
            },
        };
    },
    async beforeMount() {
        const otherDeviceResponse = await useFetch("/api/pushservice/device", {
            method: "get",
        });
        if (otherDeviceResponse.status.value === "success") {
            if (!otherDeviceResponse.data.value) {
                this.error = {
                    show: true,
                    message:
                        "Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.",
                };
                return;
            }
            if (otherDeviceResponse.data.value.deviceFound) {
                this.hasPushNotificationActive = true;
            } else {
                this.hasPushNotificationActive = false;
                return;
            }
        }
    },
};
</script>

<template>
    <VCard>
        <VCardTitle>E-Mail Benachrichtigungen</VCardTitle>
        <VCardText v-if="hasPushNotificationActive">
            <VIcon>mdi-bell</VIcon>
            Du hast die Push-Benachrichtigungen aktiviert. Deaktiviere sie, wenn du via
            E-Mail benachrichtigt werden möchtest.
            <VBtn link to="/settings/notifications/push" color="error">
                Zum Deaktivieren
            </VBtn>
        </VCardText>
        <VCardText v-else>
            E-Mail Benachrichtigungen sind noch nicht verfügbar.
        </VCardText>
    </VCard>
</template>

<style scoped>
.check-result {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 20px;
    text-align: center;
}
</style>
