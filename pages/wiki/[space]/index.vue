<script lang="ts">
import format from "date-fns/format";

definePageMeta({
    layout: "default",
});

type Wiki = {
    url: string;
    name: string;
    author: string;
    lastChangedBy: string;
    lastChanged: number; // timestamp
    preview: string; // first 60 chars of the content
};

export default {
    data(): {
        spaceUrl: string;
        state: "success" | "loading" | "error" | "empty";
        spaceName: string;
        spaceDescription: string;
        pages: Wiki[];
        my_permissions: number;
        /*
        - 0: no permissions
        - 1: read
        - 2: create pages, edit and delete own pages
        - 3: edit all pages
        - 4: delete all pages
        - 5: add readers
        - 6: add editors
        - 7: admin (all permissions, including adding admins)
        - 8: owner (all permissions, including adding admins, deleting space. permissions can't be removed except by owner giving ownership to someone else)
        */
    } {
        return {
            spaceUrl: "",
            state: "success",
            spaceName: "",
            spaceDescription: "",
            pages: [
                {
                    url: "test",
                    name: "Test",
                    author: "Test",
                    lastChangedBy: "Test",
                    lastChanged: new Date().getTime(),
                    preview: "Test",
                },
                {
                    url: "test",
                    name: "Test",
                    author: "Test",
                    lastChangedBy: "Test",
                    lastChanged: new Date().getTime(),
                    preview: "Test",
                },
                {
                    url: "test",
                    name: "Test",
                    author: "Test",
                    lastChangedBy: "Test",
                    lastChanged: new Date().getTime(),
                    preview: "Test",
                },
                {
                    url: "test",
                    name: "Test",
                    author: "Test",
                    lastChangedBy: "Test",
                    lastChanged: new Date().getTime(),
                    preview: "Test",
                },
            ],
            my_permissions: 8,
        };
    },
    methods: {
        UTCtoStr(value: number): string {
            // when today, show just 'heute'
            if (format(value, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")) {
                return "heute";
            }
            // when yesterday, show just 'gestern'
            else if (
                format(value, "yyyy-MM-dd") ===
                format(new Date(Date.now() - 86400000), "yyyy-MM-dd")
            ) {
                return "gestern";
            }
            // when last 7 days, show week day (e.g. 'Montag')
            else if (value > Date.now() - 518400000) {
                return "am " + format(value, "EEEE");
            }
            return "am " + format(value, "yyyy-MM-dd");
        },
    },
    async beforeMount() {
        if (Array.isArray(this.$route.params.space)) {
            this.spaceUrl = this.$route.params.space[0];
        } else {
            this.spaceUrl = this.$route.params.space;
        }
    },
};
</script>
<template>
    <h1>Wiki</h1>
    <h2>{{ spaceName || spaceUrl }}</h2>
    <p>{{ spaceDescription }}</p>
    <VCard v-if="state === 'loading'">
        <VCardText>
            <VProgressCircular indeterminate color="primary"></VProgressCircular>
        </VCardText>
    </VCard>
    <VCard v-if="state === 'error'">
        <VCardTitle> Es ist ein Fehler aufgetreten. </VCardTitle>
        <VCardText>
            Es ist ein Fehler aufgetreten.<br />Prüfe, ob
            <ul>
                <li>das Wiki Space existiert.</li>
                <li>du die Berechtigung hast, das Wiki Space zu sehen.</li>
                <li>du eine funktionierende Internet-Verbindung hast.</li>
            </ul>
        </VCardText>
    </VCard>
    <VList v-if="state === 'success'">
        <VListItem
            v-for="page in pages"
            v-bind:key="page.url"
            :to="`/wiki/${spaceUrl}/${page.url}`"
        >
            <VListItemTitle>
                {{ page.name }}
            </VListItemTitle>
            <VListItemSubtitle>
                <div class="page-details__last-changed">
                    Zuletzt geändert {{ UTCtoStr(page.lastChanged) }} von
                    {{ page.lastChangedBy }}
                </div>
                <div class="page-details__preview">
                    {{ page.preview }}
                </div>
                <div class="page-details__author">Erstellt von {{ page.author }}</div>
                <div class="page-details__url">/wiki/{{ spaceUrl }}/{{ page.url }}</div>
            </VListItemSubtitle>
        </VListItem>
    </VList>
    <VDivider v-if="state === 'success'" />
    <VCard v-if="state === 'success' && my_permissions > 1">
        <VCardTitle class="button-panel">
            <VBtn
                variant="flat"
                color="primary"
                v-if="my_permissions >= 2"
                :to="`/wiki/${spaceUrl}/write`"
                prepend-icon="mdi-feather"
            >
                Neue Seite erstellen
            </VBtn>
            <VBtn
                variant="flat"
                color="primary"
                v-if="my_permissions >= 5"
                :to="`/wiki/${spaceUrl}/permissions`"
                prepend-icon="mdi-account-multiple"
            >
                Benutzer verwalten
            </VBtn>
            <VBtn
                variant="flat"
                color="primary"
                v-if="my_permissions >= 7"
                :to="`/wiki/${spaceUrl}/settings`"
                prepend-icon="mdi-cog"
            >
                Einstellungen
            </VBtn>
            <VBtn
                variant="flat"
                color="red"
                v-if="my_permissions >= 8"
                :to="`/wiki/${spaceUrl}/delete`"
                prepend-icon="mdi-delete"
            >
                Wiki Space löschen
            </VBtn>
        </VCardTitle>
    </VCard>
    <VCard v-if="state === 'empty'">
        <VCardTitle> Es gibt noch keine Seiten in diesem Wiki Space. </VCardTitle>
        <VCardText>
            Es gibt noch keine Seiten in diesem Wiki Space.<br />Erstelle eine neue Seite,
            indem du auf den Button unten klickst.
        </VCardText>
    </VCard>
</template>

<style scoped>
.v-list-item-subtitle {
    display: flex;
    flex-direction: column;
    height: 33px;
    transition: height 0.2s ease-in-out;
    overflow: hidden;
    text-wrap: nowrap;
}

.v-list-item:hover .v-list-item-subtitle {
    height: 70px;
}

.v-list-item:hover :is(.page-details__author, .page-details__url) {
    opacity: 1;
}

.page-details__last-changed {
    font-size: 0.65em;
    font-style: italic;
}

.page-details__author {
    font-size: 0.8em;
    opacity: 0;
    transition: opacity 0.5s ease-in-out;
}

.page-details__url {
    font-size: 0.8em;
    opacity: 0;
    transition: opacity 0.5s ease-in-out;
}

.button-panel {
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(auto-fit, minmax(150px, 300px));
    grid-template-rows: repeat(auto-fit, 50px);
}
</style>
