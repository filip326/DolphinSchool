<script lang="ts">
export default {
    data() {
        return {
            tab: "ungelesen",
            show_floating_action_btn: false,
        };
    },
    async beforeMount() {
        await checkAuth({
            redirectOnMfaRequired: true,
            throwErrorOnNotAuthenticated: true,
            redirectOnPwdChange: true,
        });
        this.show_floating_action_btn = window.innerWidth < 600;
    },
};
</script>

<template>
    <VCard class="mail-app">
        <VTabs
            v-model="tab"
            center-active
            next-icon="mdi-arrow-right-bold-box-outline"
            bg-color="primary"
            prev-icon="mdi-arrow-left-bold-box-outline"
            show-arrows
            slider-color="#fff"
            density="compact"
        >
            <VTab value="ungelesen" prepend-icon="mdi-message-badge-outline"> Ungelesen </VTab>
            <VTab value="posteingang" prepend-icon="mdi-email-check-outline"> Posteingang </VTab>
            <VTab value="rundmails" prepend-icon="mdi-email-alert-outline"> Rundmails </VTab>
            <VTab value="postausgang" prepend-icon="mdi-email-fast-outline"> Postausgang </VTab>
            <VTab value="stared" prepend-icon="mdi-star"> Markiert </VTab>
            <VSpacer />
            <VBtn prepend-icon="mdi-plus" href="/mail/write" variant="text" style="margin: 0 10px">
                Neue Nachricht
            </VBtn>
        </VTabs>
        <VWindow v-model="tab">
            <VWindowItem value="ungelesen">
                <EMailList url="/emails/get/ungelesen" @email_selected="" />
            </VWindowItem>

            <VWindowItem value="posteingang">
                <EMailList url="/emails/get/ungelesen" @email_selected="" />
            </VWindowItem>

            <VWindowItem value="rundmails">
                <EMailList url="/emails/get/ungelesen" @email_selected="" />
            </VWindowItem>

            <VWindowItem value="stared">
                <EMailList url="/emails/get/stared" @email_selected="" />
            </VWindowItem>

            <VWindowItem value="postausgang">
                <EMailList url="/emails/get/ungelesen" @email_selected="" />
            </VWindowItem>

            <VWindowItem value="new"> </VWindowItem>
        </VWindow>
    </VCard>

    <v-btn
        class="floating_action_button"
        color="primary"
        icon="mdi-plus"
        link
        href="/mail/create"
        v-if="show_floating_action_btn"
    ></v-btn>
</template>

<style scoped>
.floating_action_button {
    position: fixed;
    bottom: 20px;
    right: 20px;
}
</style>
