<script lang="ts">
export default {
    name: "DefaultLayout",
    data() {
        return {
            profile: {
                loaded: true,
                data: {
                    name: "Some Name",
                    username: "Example Username",
                },
            },
            show_nav_drawer_button: false,
            navigation_items: [
                { title: "Home", icon: "mdi-home", link: "/", },
                {
                    title: "About",
                    icon: "mdi-information",
                    link: "/",
                },
                { title: "Mail", icon: "mdi-email", link: "/mail", },
                {
                    title: "Settings",
                    icon: "mdi-cog",
                    link: "/settings",
                }
            ] as { title: string; icon: `mdi-${string}`; link: string }[],
        };
    },
    beforeMount() {
        this.show_nav_drawer_button = window.innerWidth > 1200;
        useFetch("/api/whoami", { method: "GET", }).then((res) => {
            if (res.status.value === "success") {
                this.profile.data = {
                    name: res.data.value?.fullName ?? "",
                    username: res.data.value?.username ?? "",
                };

                if (this.profile.data.name !== "" && this.profile.data.username !== "") {
                    this.profile.loaded = true;
                };
            }
        });
    },
};
</script>

<template>
    <v-app dark>
        <VAppBar>
            <VAppBarNavIcon @click="show_nav_drawer_button = !show_nav_drawer_button">
            </VAppBarNavIcon>

            <VImg src="/img/School/DolphinSchool_light.png" />

            <VAppBarTitle> DolphinSchool </VAppBarTitle>
        </VAppBar>

        <VNavigationDrawer v-model="show_nav_drawer_button" class="navigation__drawer">
            <VList>
                <VListItem v-for="item in navigation_items" :key="item.title" density="compact" :to="item.link"
                    :append-icon="item.icon" :title="item.title" rounded class="navigation__list__item" />
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
    padding: 10px;
    transition: filter 50ms;
}

.profile {
    background-color: rgba(0, 0, 0, .3)
}
</style>
