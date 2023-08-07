<script lang="ts">
export default {
    props: {
        error: Object
    }
};
</script>

<template>
    <NuxtLayout name="non">
        <Error fix="/" :error="!error ? {} : error" type="http" />
    </NuxtLayout>
</template>
