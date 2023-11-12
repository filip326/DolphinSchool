<script lang="ts">
import formatDate from "date-fns/format";
export default {
    async beforeCreate() {
        await checkAuth({
            redirectOnMfaRequired: true,
            redirectOnPwdChange: true,
            throwErrorOnNotAuthenticated: true,
        });
    },
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
            activation: {
                show: boolean;
                deviceName: string;
                deviceNameRules: ((v: string) => boolean | string)[];
                state: "enter_name" | "wait" | "success" | "error";
            };
        };

        debugMode: boolean;
    } {
        return {
            pushNotificationsPermission: null,
            pushNotificationSubscibtion: null,
            checksDone: false,

            debugMode: false,

            dialogs: {
                test: {
                    show: false,
                    state: "wait",
                },
                unsubscribe: {
                    show: false,
                    state: "confirm",
                },
                activation: {
                    show: false,
                    deviceName: "",
                    deviceNameRules: [
                        (v: string) =>
                            !!v || "Bitte gib einen Namen für dieses Gerät ein.",
                        (v: string) =>
                            v.length <= 30 ||
                            "Der Name darf nicht länger als 30 Zeichen sein.",
                    ],
                    state: "enter_name",
                },
            },
        };
    },
    async beforeMount() {
        if (this.debugMode) {
            // pretend state 0
            this.debug(0);
            return;
        }
        // check if push notifications are supported
        if (!("serviceWorker" in navigator)) {
            this.pushNotificationsPermission = "not-supported";
            console.log("no service worker support");
            return;
        }
        await navigator.serviceWorker.register("/sw.js", {
            type: "module",
            scope: "/",
            updateViaCache: "none",
        });
        console.log("service worker registered");
        const serviceWorker = await navigator.serviceWorker.ready;
        if (!("pushManager" in serviceWorker)) {
            this.pushNotificationsPermission = "not-supported";
            this.checksDone = true;
            console.log("no push manager support");
            return;
        }
        console.log("push manager supported");
        const permissionState = await serviceWorker.pushManager.permissionState({
            userVisibleOnly: true,
        });
        console.log("permission state: ", permissionState);
        switch (permissionState) {
            case "granted":
                this.pushNotificationsPermission = "granted";
                break;
            case "prompt":
                this.pushNotificationsPermission = "needs-prompt";
                break;
            case "denied":
                this.pushNotificationsPermission = "denied";
                this.checksDone = true;
                return;
        }
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
    },
    methods: {
        async unsubscribe() {
            if (this.debugMode) {
                this.pushNotificationSubscibtion = false;
                return;
            }
            // unsubscribe client-side
            const serviceWorker = await navigator.serviceWorker.ready;
            const subscription = await serviceWorker.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
            }

            // unsubscribe server-side
            const response = await useFetch("/api/pushservice/subscription", {
                method: "delete",
            });
            if (response.status.value === "success") {
                this.pushNotificationSubscibtion = false;
                this.dialogs.activation.show = false;
            }
        },
        async subscribe() {
            console.log("subscribing...");
            try {
                this.dialogs.activation.state = "wait";
                if (this.debugMode) {
                    this.pushNotificationSubscibtion = true;
                    this.dialogs.activation.state = "success";
                    return;
                }
                // subscribe client-side
                navigator.serviceWorker.register("/sw.js");
                const serviceWorker = await navigator.serviceWorker.ready;
                if (!("pushManager" in serviceWorker)) {
                    this.dialogs.activation.state = "error";
                    return;
                }
                const serverVapidKeyRes = await useFetch(
                    "/api/pushservice/vapid/publickey",
                    {
                        method: "get",
                    },
                );
                if (
                    serverVapidKeyRes.status.value !== "success" ||
                    !serverVapidKeyRes.data.value ||
                    !serverVapidKeyRes.data.value.publicKey ||
                    typeof serverVapidKeyRes.data.value.publicKey !== "string"
                ) {
                    this.dialogs.activation.state = "error";
                    return;
                }
                const subscribtion = await serviceWorker.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: serverVapidKeyRes.data.value.publicKey,
                });
                const p256dhArraybuffer = subscribtion.getKey("p256dh");
                const authArraybuffer = subscribtion.getKey("auth");
                if (!p256dhArraybuffer || !authArraybuffer) {
                    this.dialogs.activation.state = "error";
                    return;
                } // check if the subscription has the needed keys (p256dh and auth)
                const p256dhBytes = new Uint8Array(p256dhArraybuffer);
                const authBytes = new Uint8Array(authArraybuffer);
                let p256dhBinaryString = "";
                let authBinaryString = "";
                p256dhBytes.forEach((byte) => {
                    p256dhBinaryString += String.fromCharCode(byte);
                });
                authBytes.forEach((byte) => {
                    authBinaryString += String.fromCharCode(byte);
                });
                const p256dhString = btoa(p256dhBinaryString);
                const authString = btoa(authBinaryString);
                // send subscription to server
                const response = await useFetch("/api/pushservice/register", {
                    method: "post",
                    body: {
                        endpoint: subscribtion.endpoint,
                        keys: {
                            p256dh: p256dhString,
                            auth: authString,
                        },
                        deviceName: this.dialogs.activation.deviceName,
                    },
                });
                console.log("subscribed! on server!");
                if (response.status.value === "success") {
                    console.log("subscribed! on server!");
                    this.pushNotificationSubscibtion = true;
                    this.dialogs.activation.state = "success";
                } else {
                    this.dialogs.activation.state = "error";
                }
                console.log("done!");
            } catch {
                this.dialogs.activation.state = "error";
            }
        },
        async test() {
            await useFetch("/api/pushservice/test");
        },

        debug(state: number) {
            // this is only for debugging
            // it pretends that we are in a certain state to test the GUI
            // set debugMode to true, so other scripts will not be executed
            this.debugMode = true;
            switch (state) {
                case 0:
                    // pretend push notifications are not supported
                    this.pushNotificationsPermission = "not-supported";
                    this.checksDone = true;
                    break;
                case 1:
                    // pretend push notification permission is denied
                    this.pushNotificationsPermission = "denied";
                    this.checksDone = true;
                    break;
                case 2:
                    // pretend push notification permission is granted, and we are already subscribed
                    this.pushNotificationsPermission = "granted";
                    this.pushNotificationSubscibtion = true;
                    this.checksDone = true;
                    break;
                case 3:
                    // pretend push notification permission is granted, and we are not subscribed
                    this.pushNotificationsPermission = "granted";
                    this.pushNotificationSubscibtion = false;
                    this.checksDone = true;
                    break;
                case 4:
                    // pretend push notification permission is granted, and there is another device with a subscription
                    this.pushNotificationsPermission = "other-device";
                    this.otherDevice = "Testgerät";
                    this.otherDeviceExpires = formatDate(
                        new Date(Date.now() + 1000 * 60 * 60 * 24),
                        "dd.MM.yyyy HH:mm",
                    );
                    this.checksDone = true;
                    break;
                case 5:
                    // pretend push notification permission is granted, and there was an error checking if there is another device with a subscription
                    this.pushNotificationsPermission = "error-checking";
                    this.checksDone = true;
                    break;
            }
        },
    },
};
</script>

<template>
    <VCard>
        <VCardTitle>Push-Benachrichtigungen</VCardTitle>
        <VCardText v-if="!checksDone" class="check-result">
            <!-- when checks are not done -->
            <VProgressCircular indeterminate></VProgressCircular>
            Wir überprüfen, ob du Push-Benachrichtigungen empfangen kannst...
        </VCardText>
        <VCardText
            v-else-if="pushNotificationsPermission === 'not-supported'"
            class="check-result"
        >
            <!-- when push notifications are not supported -->
            <VIcon>mdi-alert-circle-outline</VIcon>
            Dein Browser unterstützt leider keine Push-Benachrichtigungen.
        </VCardText>
        <VCardText
            v-else-if="pushNotificationsPermission === 'denied'"
            class="check-result"
        >
            <!-- when push notifications are denied -->
            <VIcon>mdi-alert-circle-outline</VIcon>
            Du hast die Push-Benachrichtigungen für diese Seite deaktiviert. Um sie zu
            aktivieren, nutze die Einstellugen deines Browsers.
        </VCardText>
        <VCardText
            v-else-if="pushNotificationsPermission === 'other-device'"
            class="check-result"
        >
            <!-- when there is another device with a subscription -->
            <VIcon>mdi-cellphone</VIcon>
            <span
                >Push-Benachrichtigungen sind bereits auf dem Gerät
                <i>{{ otherDevice }}</i> aktiviert. Deaktiviere sie dort, um sie auf
                diesem Gerät zu aktivieren. Falls du das Gerät nicht mehr hast, kannst du
                die Push-Benachrichtigungen ab dem {{ otherDeviceExpires }} Uhr wieder
                aktivieren.</span
            >
            <VBtn @click="test" color="primary">Auf {{ otherDevice }} testen</VBtn>
        </VCardText>
        <VCardText v-else-if="pushNotificationSubscibtion" class="check-result">
            <!-- when there was an error checking if there is another device with a subscription -->
            <VIcon>mdi-bell</VIcon>
            Du hast die Push-Benachrichtigungen auf diesem Gerät bereits aktiviert.
            <VBtn @click="test" color="primary">Testen</VBtn>
            <VBtn @click="unsubscribe" color="error">Deaktivieren</VBtn>
        </VCardText>
        <VCardText
            v-else-if="pushNotificationsPermission === 'error-checking'"
            class="check-result"
        >
            <!-- when we can't check if there is another device with a subscription -->
            <VIcon>mdi-alert-circle-outline</VIcon>
            Wir konnten nicht überprüfen, ob du Push-Benachrichtigungen empfangen kannst.
            Eventuell unterstützt dein Browser keine Push-Benachrichtigungen. Bitte
            versuche es später noch einmal.
        </VCardText>
        <VCardText v-else class="check-result">
            <!-- when we can subscribe -->
            <VIcon>mdi-bell-off</VIcon>
            <span>
                Du hast Push-Benachrichtigungen noch nicht aktiviert. Du kannst sie auf
                diesem Gerät aktivieren.
            </span>
            <span>
                Vermutlich wird dein Browser dich fragen, ob du Push Benachrichtigungen
                für DolphinSchool aktivieren möchtest. Drücke auf "Erlauben".
            </span>
            <VBtn color="primary" @click="dialogs.activation.state = 'enter_name'">
                <VDialog activator="parent" v-model="dialogs.activation.show">
                    <VCard v-if="dialogs.activation.state === 'enter_name'">
                        <VCardTitle> Push-Benachrichtigungen aktivieren </VCardTitle>
                        <VCardText>
                            Vergeben Sie einen Namen für dieses Gerät.
                            <VTextField
                                v-model="dialogs.activation.deviceName"
                                label="Gerätename"
                                placeholder="Max' Handy"
                                :rules="dialogs.activation.deviceNameRules"
                                outlined
                            />
                        </VCardText>
                        <VCardActions>
                            <VSpacer />
                            <VBtn @click="dialogs.activation.show = false">
                                <VIcon>mdi-close</VIcon>
                                Abbrechen
                            </VBtn>
                            <VBtn
                                color="primary"
                                variant="elevated"
                                :disabled="
                                    !dialogs.activation.deviceName ||
                                    dialogs.activation.deviceName.length > 30
                                "
                                @click="subscribe"
                            >
                                <VIcon>mdi-check</VIcon>
                                Aktivieren
                            </VBtn>
                        </VCardActions>
                    </VCard>
                    <VCard v-else-if="dialogs.activation.state === 'wait'">
                        <VCardTitle> Push-Benachrichtigungen aktivieren </VCardTitle>
                        <VCardText>
                            <VProgressCircular indeterminate></VProgressCircular>
                            Wir aktivieren die Push-Benachrichtigungen für dich...
                        </VCardText>
                    </VCard>
                    <VCard v-else-if="dialogs.activation.state === 'success'">
                        <VCardTitle> Push-Benachrichtigungen aktivieren </VCardTitle>
                        <VCardText>
                            <VIcon>mdi-check</VIcon>
                            Die Push-Benachrichtigungen wurden erfolgreich aktiviert.
                        </VCardText>
                        <VCardActions>
                            <VSpacer />
                            <VBtn
                                color="primary"
                                @click="
                                    dialogs.activation.state = 'enter_name';
                                    dialogs.activation.show = false;
                                "
                            >
                                <VIcon>mdi-check</VIcon>
                                Schließen
                            </VBtn>
                        </VCardActions>
                    </VCard>
                    <VCard v-else>
                        <VCardTitle> Push-Benachrichtigungen aktivieren </VCardTitle>
                        <VCardText>
                            <VIcon>mdi-alert-circle-outline</VIcon>
                            Es ist ein Fehler aufgetreten. Bitte versuche es später noch
                            einmal.
                        </VCardText>
                        <VCardActions>
                            <VSpacer />
                            <VBtn
                                color="primary"
                                @click="
                                    dialogs.activation.state = 'enter_name';
                                    dialogs.activation.show = false;
                                "
                            >
                                <VIcon>mdi-check</VIcon>
                                Schließen
                            </VBtn>
                        </VCardActions>
                    </VCard>
                </VDialog>
                Aktivieren
            </VBtn>
        </VCardText>
    </VCard>

    <VDivider style="margin: 10px 0" v-if="debugMode" />

    <VCard v-if="debugMode">
        <VCardTitle>Debug-Buttons</VCardTitle>
        <VCardText>
            <VBtn @click="debug(0)" color="primary">nicht unterstützt</VBtn>
            <br />
            <VBtn @click="debug(1)" color="primary">deaktiviert</VBtn>
            <br />
            <VBtn @click="debug(2)" color="primary">aktiviert</VBtn>
            <br />
            <VBtn @click="debug(3)" color="primary">nicht aktiviert</VBtn>
            <br />
            <VBtn @click="debug(4)" color="primary">auf anderem Gerät aktiviert</VBtn>
            <br />
            <VBtn @click="debug(5)" color="primary">Fehler beim Überprüfen</VBtn>
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
