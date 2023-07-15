<script setup>
const props = defineProps({
  error: Object
})
</script>

<template>
    <div>
        <NuxtLayout name="error">
            {{ error.message }}
        </NuxtLayout>
    </div>
</template>
  