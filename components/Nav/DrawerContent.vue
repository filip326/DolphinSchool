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
    <VList class="nav-ui-list">
        <!--
            add nav-ui-elements here with nav-ui-element class
            if there is no icon, add an empty div as first child
            add subelements using nav-ui-subelement class
            a subelement may not have an icon and may not have an icon
        -->
        <NuxtLink class="nav-ui-element" to="/home">
            <VIcon>mdi-home</VIcon>
            Home
        </NuxtLink>
        <NuxtLink class="nav-ui-element" to="/home">
            <VIcon>mdi-email</VIcon>
            Nachrichten
            <div class="notification">1</div>
        </NuxtLink>
        <NuxtLink class="nav-ui-subelement">
            Ungelesen
        </NuxtLink>
        <NuxtLink class="nav-ui-subelement long">
            Posteingang
        </NuxtLink>
        <NuxtLink class="nav-ui-subelement long">
            Wichtig
        </NuxtLink>
        <NuxtLink class="nav-ui-subelement long">
            Postausgang
        </NuxtLink>
        <NuxtLink class="nav-ui-element">
            <VIcon>mdi-account-group</VIcon>
            Meine Klasse
        </NuxtLink>

        <NuxtLink class="nav-ui-element">
            <VIcon>mdi-book-open-variant</VIcon>
            Meine Kurse
        </NuxtLink>
        <NuxtLink class="nav-ui-subelement">
            10a M
        </NuxtLink>
        <NuxtLink class="nav-ui-subelement long">
            10a E
        </NuxtLink>
        <NuxtLink class="nav-ui-subelement long">
            10a D
        </NuxtLink>
        <NuxtLink class="nav-ui-subelement long">
            10 Eth 1
            <div class="notification">1</div>
        </NuxtLink>

        <NuxtLink class="nav-ui-element">
            <VIcon>mdi-cog</VIcon>
            Einstellungen
        </NuxtLink>
        <NuxtLink class="nav-ui-subelement">
            Allgemein
        </NuxtLink>
        <NuxtLink class="nav-ui-subelement long">
            Meine Daten
        </NuxtLink>
        <NuxtLink class="nav-ui-subelement long">
            Sicherheit
        </NuxtLink>

        <NuxtLink class="nav-ui-element">
            <VIcon>mdi-help-circle</VIcon>
            Hilfe
        </NuxtLink>
        <NuxtLink class="nav-ui-subelement">
            Beispiel-Ticket 1
        </NuxtLink>
        <NuxtLink class="nav-ui-subelement long">
            Beispiel-Ticket 2
        </NuxtLink>
        <NuxtLink class="nav-ui-subelement long">
            Docs und FAQ
        </NuxtLink>

        <NuxtLink class="nav-ui-element">
            <VIcon>mdi-security</VIcon>
            Administration
        </NuxtLink>
        <NuxtLink class="nav-ui-subelement">
            Benutzer verwalten
        </NuxtLink>
        <NuxtLink class="nav-ui-subelement long">
            Klassen verwalten
        </NuxtLink>
        <NuxtLink class="nav-ui-subelement long">
            Kurse verwalten
        </NuxtLink>
        <NuxtLink class="nav-ui-subelement long">
            Support
        </NuxtLink>

        <NuxtLink class="nav-ui-element">
            <VIcon>mdi-logout</VIcon>
            Logout
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
    overflow-y: scroll;

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
    content: '';
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
