<script lang="ts">
export default {
    props: {
        multi: {
            type: Boolean,
            default: true,
        },
        onlyUsers: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            rules: {
                required: (value: any) => !!value || "Eingabe erforderlich",
                onlyUsers: (value: any) =>
                    !this.onlyUsers || (value && value.type === "user") || "Nur Benutzer erlaubt",
            },
            searchText: "",
            asmsqSuggestions: [],
            isUpdating: false,
        };
    },
    methods: {
        updatSuggestions() {},
        parseSelect(item: any) {
            return {
                avatar: item.avatar,
                name: item.name,
                subtitle: item.subtitle,
            };
        },
    },
};
</script>

<template>
    <div>
        <VAutoComplete
            v-model="searchText"
            :disabled="isUpdating"
            :items="asmsqSuggestions"
            chips
            closable-chips
            label="Suche"
            :multiple="multi"
        >
            <template v-slot:chip="{ props, item }">
                <v-chip
                    v-bind="props"
                    :prepend-avatar="parseSelect(item).avatar"
                    :text="parseSelect(item).name"
                ></v-chip>
            </template>

            <template v-slot:item="{ props, item }">
                <v-list-item
                    v-bind="props"
                    :prepend-avatar="parseSelect(item).avatar"
                    :title="parseSelect(item).name"
                    :subtitle="parseSelect(item).subtitle"
                ></v-list-item>
            </template>
        </VAutoComplete>
    </div>
</template>

<style scoped></style>
