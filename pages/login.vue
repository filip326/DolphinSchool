<script lang="ts">
definePageMeta({
    layout: "login",
});
export default {
    data(): {
        formState:
            | "start"
            | "loading"
            | "forgot_password"
            | "change_password"
            | "totp"
            | "passwordless";

        login: {
            username: string;
            password: string;
            buttonShake: boolean;
        };
    } {
        return {
            formState: "start",
            login: {
                username: "",
                password: "",
                buttonShake: false,
            },
        };
    },

    methods: {
        loginButtonShake() {
            return new Promise<void>((resolve) => {
                this.login.buttonShake = true;
                setTimeout(() => {
                    this.login.buttonShake = false;
                    resolve();
                }, 500);
            });
        },
        async openPasswordless() {
            this.formState = "loading";
            setTimeout(() => {
                this.formState = "passwordless";
            }, 1000);
        },
        closePasswordless() {
            this.formState = "start";
        },
        async loginButton() {
            if (this.login.username === "" || this.login.password === "") {
                await this.loginButtonShake();
                return;
            }

            this.formState = "loading";
        },
    },
};
</script>

<template>
    <VCard class="loginform small">
        <VWindow v-model="formState">
            <VWindowItem value="start">
                <VImg class="logo" src="/img/School/DolphinSchool_light.png" />
                <VCardText>
                    <VTextField label="Benutzername" v-model="login.username" />
                    <VTextField
                        label="Passwort"
                        type="password"
                        v-model="login.password"
                    />
                    <VBtn
                        variant="flat"
                        color="primary"
                        append-icon="mdi-chevron-right"
                        @click="loginButton"
                        :class="login.buttonShake ? 'shake' : ''"
                        >Login</VBtn
                    >
                    <VBtn
                        variant="text"
                        append-icon="mdi-chevron-right"
                        class="small-btn"
                        @click="openPasswordless"
                        >Passwordless-QR</VBtn
                    >
                    <VBtn variant="text" append-icon="mdi-chevron-right" class="small-btn"
                        >Passwort vergessen</VBtn
                    >
                </VCardText>
            </VWindowItem>
            <VWindowItem value="loading">
                <div class="loading">
                    <VProgressCircular indeterminate color="primary" />
                </div>
            </VWindowItem>
            <VWindowItem value="passwordless">
                <VImg class="logo" src="/img/School/DolphinSchool_light.png" />
                <VCardText>
                    Scanne den QR-Code mit deiner Kamera-App oder einem QR-Code Scanner
                    auf deinem Smartphone.
                </VCardText>
                <VImg class="qr-code" src="https://placehold.co/400" />
                <VCardText>
                    Folge dann den Anweisungen auf deinem Smartphone. Anschließend wirst
                    du automatisch eingeloggt.
                    <VBtn
                        variant="outlined"
                        prepend-icon="mdi-chevron-left"
                        class="small-btn left-button"
                        @click="closePasswordless"
                        >Zurück</VBtn
                    >
                </VCardText>
            </VWindowItem>
        </VWindow>
    </VCard>
</template>

<style scoped>
.v-card {
    padding: 5px;
}

.v-card .v-img {
    max-height: 100px;
}

.v-card-title {
    text-align: center;
    font-size: 2em;
}

.v-btn {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 20px;
}

.v-btn.left-button {
    justify-content: left;
}

.v-btn.small-btn {
    font-size: 0.9em;
}

.v-btn .v-btn__append {
    margin-left: auto;
}

.v-card-text {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 10px;
}

.shake {
    animation: shake 0.5s;
}

.loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
}

@keyframes shake {
    0%,
    100% {
        transform: translateX(0);
    }
    10%,
    30%,
    50%,
    70%,
    90% {
        translate: -5px;
    }
    20%,
    40%,
    60%,
    80% {
        translate: 5px;
    }
}
</style>
