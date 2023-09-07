<script lang="ts">
export default {};
</script>

<template>
    <VFooter color="primary">
        <VRow style="padding: none" dense no-gutters>
            <VIcon icon="mdi-alpha-d" />
            <VIcon icon="mdi-alpha-o" />
            <VIcon icon="mdi-alpha-l" />
            <VIcon icon="mdi-alpha-p" />
            <VIcon icon="mdi-alpha-h" />
            <VIcon icon="mdi-alpha-i" />
            <VIcon icon="mdi-alpha-n" />
            <VIcon icon="mdi-alpha-s" />
            <VIcon icon="mdi-alpha-c" />
            <VIcon icon="mdi-alpha-h" />
            <VIcon icon="mdi-alpha-o" />
            <VIcon icon="mdi-alpha-o" />
            <VIcon icon="mdi-alpha-l" />
        </VRow>

        <span class="divider"></span>

        <div
            style="
                padding-top: 2px;
                padding-bottom: 2px;
                gap: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: row;
            "
        >
            <!-- todo: add links -->
        </div>

        <span class="divider short"></span>

        <NuxtLink to="/copyright"><strong>&copy; 2023</strong></NuxtLink>
    </VFooter>
</template>

<style scoped>
.divider {
    width: min(calc(100% - 48px), 600px);
    overflow: hidden;
    border-radius: 4px;
    height: 2px;
    opacity: 0.5;
    background: rgb(var(--v-theme-on-primary));
}

.divider.short {
    width: min(calc(100% - 48px), 350px);
}
.v-footer {
    padding: 12px;
    padding-top: 0;
    padding-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    min-width: 100svw;
    max-width: 100svw;
    overflow: hidden;
}

a,
a:hover {
    color: inherit;
    text-decoration: none;
}

a:hover:not(.v-btn) {
    text-decoration: underline;
}
</style>
