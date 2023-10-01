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
    <div class="nav-ui-list">
        <!--
            add nav-ui-elements here with nav-ui-element class
            if there is no icon, add an empty div as first child
        -->
        <NuxtLink class="nav-ui-element" to="/home">
            <VIcon>mdi-home</VIcon>
            Home
        </NuxtLink>
        <NuxtLink class="nav-ui-element" to="/home">
            <div></div>
            Home
        </NuxtLink>

    </div>
</template>

<style scoped>
.nav-ui-list {
    padding: 10px 4px 4px 10px;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 4px;
}


.nav-ui-element {
    padding: 3px;
    display: flex;
    gap: 5px;
    align-items: center;
    color: var(--v-theme-on-surface);
    text-decoration: none;
    overflow: hidden;
}

.nav-ui-element div:first-child {
    width: 24px;
    height: 24px;
}
</style>
