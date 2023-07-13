<script lang="ts">

export default {
    data() {
        return {
            tab: "ungelesen"
        }
    }
}

</script>

<template>
    <VCard class="mail-app">
        <VTabs v-model="tab" center-active next-icon="mdi-arrow-right-bold-box-outline" bg-color="primary"
          prev-icon="mdi-arrow-left-bold-box-outline" show-arrows slider-color="#fff" density="compact">
          <VTab value="ungelesen" prepend-icon="mdi-message-badge-outline">
            Ungelesen
          </VTab>
          <VTab value="posteingang" prepend-icon="mdi-email-check-outline">
            Posteingang
          </VTab>
          <VTab value="rundmails" prepend-icon="mdi-email-alert-outline"> Rundmails </VTab>
          <VTab value="postausgang" prepend-icon="mdi-email-fast-outline">
            Postausgang
          </VTab>
          <VTab value="stared" prepend-icon="mdi-star"> Markiert </VTab>
          <VTab value="new" prepend-icon="mdi-plus"> Neu </VTab>
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
    
          <VWindowItem value="new">
          </VWindowItem>
        </VWindow>
      </VCard>
</template>