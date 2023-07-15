<script lang="ts">
export default {
    name: "ErrorLayout"
}
</script>

<template>
    <v-app>
        <VMain class="errorWrapper">
            <v-card>
                <v-card-img>
                    <VImg src="/img/School/DolphinSchool_light.png" cover />
                </v-card-img>
                <v-card-title>
                    Fehler
                </v-card-title>
                <v-card-text>
                    <slot></slot>
                </v-card-text>
            </v-card>
            <slot />
        </VMain>
    </v-app>
</template>

<style scoped>
.errorWrapper {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100vw;
}

.v-main {
    padding: 10px;
    transition: filter 50ms;
}
</style>
