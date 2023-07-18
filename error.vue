<script lang="ts">
export default {
    props: {
        error: Object
    }
}
</script>

<template>
    <NuxtLayout name="error">
        <Error fix="/" :error="error ?? {}" type="http" />
    </NuxtLayout>
</template>
