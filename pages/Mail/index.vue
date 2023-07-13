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
    <v-card class="mail-app">
        <v-tabs v-model="tab" center-active next-icon="mdi-arrow-right-bold-box-outline" bg-color="primary"
          prev-icon="mdi-arrow-left-bold-box-outline" show-arrows slider-color="#fff" density="compact">
          <v-tab value="ungelesen" prepend-icon="mdi-message-badge-outline">
            Ungelesen
          </v-tab>
          <v-tab value="posteingang" prepend-icon="mdi-email-check-outline">
            Posteingang
          </v-tab>
          <v-tab value="rundmails" prepend-icon="mdi-email-alert-outline"> Rundmails </v-tab>
          <v-tab value="postausgang" prepend-icon="mdi-email-fast-outline">
            Postausgang
          </v-tab>
          <v-tab value="stared" prepend-icon="mdi-star"> Markiert </v-tab>
          <v-tab value="new" prepend-icon="mdi-plus"> Neu </v-tab>
        </v-tabs>
        <v-window v-model="tab">
          <v-window-item value="ungelesen">
            <EmailFilter />
            <EmailList url="/emails/get/ungelesen" @email_selected="" />
          </v-window-item>
    
          <v-window-item value="posteingang">
            <EmailFilter />
            <EmailList url="/emails/get/ungelesen" @email_selected="" />
          </v-window-item>
    
          <v-window-item value="rundmails">
            <EmailFilter />
            <EmailList url="/emails/get/ungelesen" @email_selected="" />
          </v-window-item>
    
          <v-window-item value="stared">
            <EmailFilter />
            <EmailList url="/emails/get/stared" @email_selected="" />
          </v-window-item>
    
          <v-window-item value="postausgang">
            <EmailFilter />
            <EmailList url="/emails/get/ungelesen" @email_selected="" />
          </v-window-item>
    
          <v-window-item value="new">
            <WriteEmail />
          </v-window-item>
        </v-window>
      </v-card>
</template>