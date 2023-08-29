<script lang="ts">
export default {
    props: {
        auth: {
            type: Boolean,
            required: true,
        },
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
    data() {
        return {
            navigation_items: [
                {
                    title: "Startseite",
                    icon: "mdi-home",
                    link: "/home",
                    auth: true,
                },
                { title: "Login", icon: "mdi-login", link: "/" },
                { title: "Mail", auth: true, icon: "mdi-email", link: "/mail" },
                {
                    title: "Einstellungen",
                    auth: true,
                    icon: "mdi-cog",
                    link: "/settings",
                },
            ] as Array<{ title: string; auth?: boolean; icon: `mdi-${string}`; link: string }>,
        };
    },
    computed: {
        filteredNavItems() {
            if (this.auth) return this.navigation_items.filter((item) => item.auth);
            return this.navigation_items.filter((item) => !item.auth);
        },
    },
};
</script>

<template>
    <VList>
        <VListItem
            v-for="item in filteredNavItems"
            :key="item.title"
            density="compact"
            :to="item.link"
            :append-icon="item.icon"
            :title="item.title"
            rounded
            class="navigation__list__item"
        />
        <VListItem
            density="compact"
            rounded
            class="navigation__list__item"
            append-icon="mdi-logout"
            title="Logout"
            @click="logout"
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
