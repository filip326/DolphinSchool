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
            navigation_items: [] as {
                classes: string;
                icon?: string;
                text: string;
                href: string;
            }[],
        };
    },
    async beforeMount() {
        console.log("[ NavBar ] Loading navigation items");
        const res = await useFetch("/api/ui/navbar");
        if (res.status.value !== "success") {
            return;
        }

        const navItems = [];

        for (const item of res.data.value ?? []) {
            navItems.push({
                classes: "nav-ui-element",
                icon: item.icon,
                text: item.label,
                href: item.location,
            });

            if (!item.children) continue;

            let isFirst = true;
            for (const subitem of item.children) {
                navItems.push({
                    classes: isFirst ? "nav-ui-subelement" : "nav-ui-subelement long",
                    text: subitem.label,
                    href: subitem.location,
                });
                isFirst = false;
            }
        }
        this.navigation_items = navItems;
        console.log("[ NavBar ] Loaded navigation items");
    },
};
</script>

<template>
    <VList class="nav-ui-list">
        <!--
            add nav-ui-elements here with nav-ui-element class
            if there is no icon, add an empty div as first child
            add subelements using nav-ui-subelement class
            a subelement may not have an icon and may not have an icon
        -->
        <NuxtLink
            v-for="item in navigation_items"
            :key="item.text"
            :class="item.classes"
            :to="item.href"
        >
            <VIcon v-if="item.icon">{{ item.icon }}</VIcon>
            <div v-else-if="item.classes === 'nav-ui-element'"></div>
            {{ item.text }}
        </NuxtLink>
    </VList>
</template>

<style scoped>
.nav-ui-list {
    padding: 20px 4px 20px 10px;
    height: 100%;
    width: 100%;
    display: grid;

    grid-template-columns: 1fr;
    grid-auto-rows: 26px;
    gap: 5px;

    overflow-x: hidden;
    overflow-y: auto;
    /* Auto removes the scrollbar, until it is needed */
}

.nav-ui-list::-webkit-scrollbar {
    display: none;
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

.nav-ui-subelement {
    padding: 3px;
    padding-left: 32px;
    display: flex;
    text-decoration: none;
    overflow: hidden;
    align-items: center;
    color: rgb(var(--v-theme-on-surface));
}

.nav-ui-subelement::before {
    content: "";
    display: block;
    position: absolute;
    border-left: 1.5px solid;
    border-bottom: 1.5px solid;
    border-color: rgb(var(--v-theme-on-surface));
    width: 13px;
    height: 15px;

    translate: -21px -4px;

    border-bottom-left-radius: 5px;
}

.nav-ui-subelement.long::before {
    height: 36px;

    translate: -21px -15px;
}

.notification {
    position: absolute;
    right: 0;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    color: rgb(var(--v-theme-secondary));
}
</style>
