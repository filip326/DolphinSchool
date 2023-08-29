<script lang="ts">
export default {
    name: "nonAuthLayout",
    data() {
        return {
            show_nav_drawer_button: false,
        };
    },
    beforeMount() {
        this.show_nav_drawer_button = window.innerWidth > 1200;
    },
};
</script>

<template>
    <v-app dark>
        <VAppBar>
            <VAppBarNavIcon @click="show_nav_drawer_button = !show_nav_drawer_button"> </VAppBarNavIcon>

            <VImg src="/img/School/DolphinSchool_light.png" />

            <VAppBarTitle> DolphinSchool </VAppBarTitle>
        </VAppBar>

        <VNavigationDrawer v-model="show_nav_drawer_button" class="navigation__drawer">
            <NavDrawerContent :auth="false" />
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
