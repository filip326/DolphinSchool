<script lang="ts">
export default {
    name: "nonAuthLayout",
    data() {
        return {
            show_nav_drawer_button: false,
            searchItemLink: "",
            searchWidth: false,
            items: [
                { title: "Start", icon: "mdi-home", link: "/" }
                // add routes for docs
            ] as { title: string; icon: `mdi-${string}`; link: string }[]
        };
    },
    beforeMount() {
        this.show_nav_drawer_button = window.innerWidth > 1200;
        this.searchWidth = window.innerWidth > 1200;
    },
    computed: {
        filterOutDefaultURLs() {
            return this.items.filter((item) => {
                const filterOut = ["/"];
                filterOut.includes(item.link) === false;
            });
        }
    }
};
</script>

<template>
    <v-app dark>
        <VAppBar>
            <VAppBarNavIcon @click="show_nav_drawer_button = !show_nav_drawer_button" />

            <VImg src="/img/School/DolphinSchool_light.png" />

            <VAppBarTitle
                :style="`height: 100%; align-items: center; max-width: ${
                    show_nav_drawer_button ? '300px' : '80%'
                }`"
            >
                <VAutocomplete
                    @update:search="navigateTo(searchItemLink)"
                    label="Suche"
                    prepend-inner-icon="mdi-magnify"
                    variant="underlined"
                    :items="items"
                    item-text="title"
                    v-model="searchItemLink"
                    item-value="link"
                    hide-no-data
                    hide-selected
                    clearable
                />
            </VAppBarTitle>
        </VAppBar>

        <VNavigationDrawer v-model="show_nav_drawer_button" class="navigation__drawer">
            <VList>
                <VListItem
                    v-for="item in items"
                    :key="item.title"
                    density="compact"
                    :to="item.link"
                    :append-icon="item.icon"
                    :title="item.title"
                    rounded
                    class="navigation__list__item"
                />
            </VList>
        </VNavigationDrawer>

        <VMain>
            <div class="content__wrapper">
                <slot />
            </div>
        </VMain>
    </v-app>
</template>

<style scoped>
.v-img {
    max-width: 64px !important;
}

.navigation__list {
    text-decoration: none;
}

.navigation__list__item {
    text-decoration: none;
    margin: 5px 10px;
}

.content__wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
    padding: 10px;
    transition: filter 50ms;
}
</style>
