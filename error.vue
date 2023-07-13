<script setup>
const props = defineProps({
  error: Object
})
</script>

<template>
    <div>
        <NuxtLayout>
            <v-alert :title="`${error.statusCode} Ein Fehler ist aufgetreten!`" :text="error.statusMessage">
                <v-btn @click="clearError({ redirect: '/' })">
                    Zurück
                </v-btn>
            </v-alert>
        </NuxtLayout>
    </div>
</template>
  