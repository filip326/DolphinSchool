<script lang="ts">
export default {
    name: "DefaultLayout",
    data() {
        return {
            show_nav_drawer_button: false,
            show_logout_button: false,
        };
    },
    methods: {
        async logout() {
            const res = await useFetch("/api/auth/logout", {
                method: "GET",
            });

            if (res.status.value == "success") {
                this.$router.push("/");
            }
        },
    },
    beforeMount() {
        this.show_nav_drawer_button = window.innerWidth > 1200;
        this.show_logout_button = window.innerWidth > 1200;
    },
};
</script>

<template>
    <v-app dark>
        <VAppBar>
            <VAppBarNavIcon @click="show_nav_drawer_button = !show_nav_drawer_button"> </VAppBarNavIcon>

            <VImg src="/img/School/DolphinSchool_light.png" />

            <VAppBarTitle> DolphinSchool </VAppBarTitle>

            <VSpacer />

            <VIcon style="margin-right: 14px" :v-if="show_logout_button" icon="mdi-logout" @click="logout" />
        </VAppBar>

        <VNavigationDrawer v-model="show_nav_drawer_button" class="navigation__drawer">
            <NavDrawerContent :auth="true" />
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
