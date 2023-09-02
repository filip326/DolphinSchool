<script lang="ts">
export default {
    async beforeCreate() {
        await checkAuth({
            redirectOnMfaRequired: true,
            throwErrorOnNotAuthenticated: true,
            redirectOnPwdChange: true,
        });
    },
    data() {
        return {
            tab: null,
            tabs: ["Mitglieder", "Stundenplan", "Verlauf", "Anwesendheit", "Noten"],
            search_class: "",
            timeout: ref<any>(),
        };
    },
    methods: {
        search() {
            console.log(this.search_class);
        },
        searchTimer() {
            if (this.timeout) {
                clearTimeout(this.timeout);
            }
            this.timeout = setTimeout(() => {
                this.search();
            }, 500);
        },
    },
};
</script>

<template>
    <VCard>
        <VCardTitle>
            {{ $route.params.id }}
        </VCardTitle>
        <VCardSubtitle> bei {{ $route.params.id }} </VCardSubtitle>

        <VCardText>
            <!-- tabs -->
            <VTabs
                v-model="tab"
                background-color="transparent"
                color="secondary"
                slider-color="secondary"
            >
                <VTab v-for="tab in tabs" :key="tab">
                    {{ tab }}
                </VTab>
            </VTabs>

            <!-- tab content -->
            <VWindow v-model="tab">
                <VWindowItem value="Mitglieder">
                    <VCard>
                        <VCardTitle>Lehrkräfte</VCardTitle>
                        <VCardText>
                            <VList>
                                <VListItem>
                                    <VListItemTitle>Lehrkraft 1</VListItemTitle>
                                    <VListItemSubtitle>Kontaktdaten</VListItemSubtitle>
                                </VListItem>
                            </VList>
                        </VCardText>
                    </VCard>

                    <VCard>
                        <VCardTitle>Schüler</VCardTitle>
                        <VCardText>
                            <VList>
                                <VListItem>
                                    <VListItemTitle>Schüler 1</VListItemTitle>
                                    <VListItemSubtitle>Kontaktdaten</VListItemSubtitle>
                                </VListItem>
                                <VListItem>
                                    <VListItemTitle>Schüler 2</VListItemTitle>
                                    <VListItemSubtitle>Kontaktdaten</VListItemSubtitle>
                                </VListItem>
                            </VList>
                        </VCardText>
                    </VCard>
                </VWindowItem>
            </VWindow>
        </VCardText>
    </VCard>
</template>
