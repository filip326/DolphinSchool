<script lang="ts">
export default {
    props: {
        navigation_items: {
            type: Array<{ title: string; icon: `mdi-${string}`; link: string }>,
            required: true,
        },
    },
};
</script>

<template>
    <VList>
        <VListItem
            v-for="item in navigation_items"
            :key="item.title"
            density="compact"
            :to="item.link"
            :append-icon="item.icon"
            :title="item.title"
            rounded
            class="navigation__list__item"
        />
    </VList>
</template>

<style scoped>
.navigation__list {
    text-decoration: none;
}

.navigation__list__item {
    text-decoration: none;
    margin: 5px 10px;
}
</style>
