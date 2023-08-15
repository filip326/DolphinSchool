<script >
export default {
    async beforeMount() {
        await checkAuth();
    }
};
</script>

<template>
    <h1>Home</h1>
</template>

<style scoped></style>
