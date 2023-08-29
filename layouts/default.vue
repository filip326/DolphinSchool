<script lang="ts">
export default {
    name: "DefaultLayout",
    data() {
        return {
            show_nav_drawer_button: false,
            navigation_items: [
                { title: "Home", icon: "mdi-home", link: "/" },
                {
                    title: "About",
                    icon: "mdi-information",
                    link: "/",
                },
                { title: "Mail", icon: "mdi-email", link: "/mail" },
                {
                    title: "Settings",
                    icon: "mdi-cog",
                    link: "/settings",
                },
            ] as { title: string; icon: `mdi-${string}`; link: string }[],
        };
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
            <NavDrawerContent :navigation_items="navigation_items" />
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

.content__wrapper {
    padding: 10px;
    transition: filter 50ms;
}
</style>
