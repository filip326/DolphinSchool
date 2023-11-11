<script lang="ts">
import formatDate from "date-fns/format";
export default {
    data(): {
        pushNotificationsPermission:
            | "granted" // we have permission to subscribe, if we are not subscribed yet
            | "needs-prompt" // we can subscribe, but there will be a popup
            | "denied" // we can't subscribe, because the user denied it
            | "not-supported" // push notifications are not supported
            | "other-device" // there is another device with a subscription, so we can't subscribe on this device
            | "error-checking" // there was an error checking if there is another device with a subscription, so we can't subscribe on this device
            | null; // the checks are not done yet
        pushNotificationSubscibtion: boolean | null;
        otherDevice?: string;
        otherDeviceExpires?: string;
        checksDone: boolean;

        dialogs: {
            test: {
                show: boolean;
                state: "wait" | "success" | "error";
            };
            unsubscribe: {
                show: boolean;
                state: "confirm" | "wait" | "success" | "error";
            };
        };
    } {
        return {
            pushNotificationsPermission: null,
            pushNotificationSubscibtion: null,
            checksDone: false,

            dialogs: {
                test: {
                    show: false,
                    state: "wait",
                },
                unsubscribe: {
                    show: false,
                    state: "confirm",
                },
            },
        };
    },
    async beforeMount() {
        // check if push notifications are supported
        if (!("serviceWorker" in navigator)) {
            this.pushNotificationsPermission = "not-supported";
            return;
        }
        const serviceWorker = await navigator.serviceWorker.ready;
        if (!("pushManager" in serviceWorker)) {
            this.pushNotificationsPermission = "not-supported";
            this.checksDone = true;
            return;
        }
        const permissionState = await serviceWorker.pushManager.permissionState();
        switch (permissionState) {
            case "granted":
                this.pushNotificationsPermission = "granted";
                break;
            case "prompt":
                this.pushNotificationsPermission = "needs-prompt";
                break;
            case "denied":
                this.pushNotificationsPermission = "denied";
                break;
        }
        if (this.pushNotificationsPermission === "granted") {
            // now check if we are subscribed
            const subscription = await serviceWorker.pushManager.getSubscription();
            if (subscription) {
                // we are subscribed
                this.pushNotificationSubscibtion = true;
                this.checksDone = true;
                return;
            }
            // check if there is another device with a subscription
            // if so, we can't subscribe on this device
            const otherDeviceResponse = await useFetch("/api/pushservice/device", {
                method: "get",
            });
            if (otherDeviceResponse.status.value === "success") {
                if (!otherDeviceResponse.data.value) {
                    // error checking
                    this.pushNotificationsPermission = "error-checking";
                    this.checksDone = true;
                    return;
                }
                if (otherDeviceResponse.data.value.deviceFound) {
                    this.otherDevice = otherDeviceResponse.data.value.deviceName;
                    this.otherDeviceExpires = formatDate(
                        otherDeviceResponse.data.value.expires,
                        "dd.MM.yyyy HH:mm",
                    );
                    this.pushNotificationsPermission = "other-device";
                    this.checksDone = true;
                    return;
                } else {
                    // no other device found, we can subscribe
                    this.pushNotificationsPermission = "granted";
                    this.checksDone = true;
                    return;
                }
            }
        }
    },
    methods: {
        async unsubscribe() {
            // unsubscribe client-side
            const serviceWorker = await navigator.serviceWorker.ready;
            const subscription = await serviceWorker.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
            }

            // unsubscribe server-side
            const response = await useFetch("/api/pushservice/subscribe", {
                method: "delete",
            });
            if (response.status.value === "success") {
                this.pushNotificationSubscibtion = false;
            }
        },
        async subscribe() {},
        async test() {},
    },
};
</script>

<template>
    <VCard>
        <VCardTitle>Push-Benachrichtigungen</VCardTitle>
        <VCardText v-if="!checksDone">
            <!-- when checks are not done -->
            <VProgressCircular indeterminate></VProgressCircular>
            Wir überprüfen, ob du Push-Benachrichtigungen empfangen kannst...
        </VCardText>
        <VCardText v-else-if="pushNotificationsPermission === 'not-supported'">
            <!-- when push notifications are not supported -->
            <VIcon>mdi-alert-circle-outline</VIcon>
            Dein Browser unterstützt leider keine Push-Benachrichtigungen.
        </VCardText>
        <VCardText v-else-if="pushNotificationsPermission === 'denied'">
            <!-- when push notifications are denied -->
            <VIcon>mdi-alert-circle-outline</VIcon>
            Du hast die Push-Benachrichtigungen für diese Seite deaktiviert.
        </VCardText>
        <VCardText v-else-if="pushNotificationsPermission === 'other-device'">
            <!-- when there is another device with a subscription -->
            <VIcon>mdi-cellphone</VIcon>
            Push-Benachrichtigungen sind bereits auf dem Gerät
            {{ otherDevice }} aktiviert. Deaktiviere sie dort, um sie auf diesem Gerät zu
            aktivieren. Falls du das Gerät nicht mehr hast, kannst du die
            Push-Benachrichtigungen ab dem {{ otherDeviceExpires }} Uhr wieder aktivieren.
            <VBtn @click="test" color="primary">Auf {{ otherDevice }} testen</VBtn>
        </VCardText>
        <VCardText v-else-if="pushNotificationSubscibtion">
            <!-- when there was an error checking if there is another device with a subscription -->
            <VIcon>mdi-bell</VIcon>
            Du hast die Push-Benachrichtigungen auf diesem Gerät bereits aktiviert.
            <VBtn @click="test" color="primary">Testen</VBtn>
            <VBtn @click="unsubscribe" color="error">Deaktivieren</VBtn>
        </VCardText>
        <VCardText v-else>
            <!-- when we can subscribe -->
            <VIcon>mdi-bell-off</VIcon>
            Du hast Push-Benachrichtigungen auf diesem Gerät noch nicht aktiviert.
            <VBtn @click="subscribe" color="primary">Aktivieren</VBtn>
        </VCardText>
    </VCard>
</template>
