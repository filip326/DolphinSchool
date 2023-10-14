<script lang="ts">
export default {
    props: {
        user_id: {
            type: String,
            required: true,
        },
    },
    data(): {
        searchQuery: string;
        modelValue: string;
        autocompleteItems: {
            label: string;
            id: string;
        }[];
        timeout: NodeJS.Timeout | null;
        autocomplete_loading: boolean;
    } {
        return {
            modelValue: "",
            searchQuery: "",
            autocompleteItems: [],
            timeout: null,
            autocomplete_loading: false,
        };
    },
    methods: {
        async search() {
            const searchTerm = this.searchQuery.split("(")[0].trim();
            if (searchTerm.length < 3) {
                return;
            }

            const response = await useFetch("/api/search/user", {
                method: "get",
                params: {
                    search: searchTerm,
                },
            });
            if (response.status.value !== "success") {
                return;
            }

            this.autocompleteItems = [
                ...this.autocompleteItems.filter((i) => i.id === this.modelValue),
                ...response.data.value!.map((user) => ({
                    label: user.label,
                    id: user.id,
                })),
            ];

            // filter out duplicates
            this.autocompleteItems = this.autocompleteItems.filter(
                (item, index, self) => index === self.findIndex((t) => t.id === item.id),
            );
        },

        searchTimer() {
            const searchTerm = this.searchQuery.split("(")[0].trim();
            if (searchTerm.length < 3) {
                if (this.modelValue === "") this.autocompleteItems = [];
                return;
            }
            // calls search after 1500 ms, except if another key is pressed. if another key is pressed, the timer is reset
            if (this.timeout !== null) {
                clearTimeout(this.timeout);
            }
            if (this.autocompleteItems.length === 0) this.autocomplete_loading = true;
            this.timeout = setTimeout(() => {
                this.autocomplete_loading = false;
                this.search();
            }, 1000);
        },
        customFilter(itemTitle: string, queryText: string) {
            const searchTerm = queryText.split("(")[0].trim();
            return itemTitle.toLowerCase().includes(searchTerm.toLowerCase());
        },
    },
};
</script>

<template>
    User-Id: {{ modelValue }}
    <VAutocomplete
        v-model="modelValue"
        v-model:search="searchQuery"
        :items="autocompleteItems"
        item-title="label"
        item-value="id"
        :custom-filter="() => true"
        label="Suche nach Benutzer"
        outlined
        dense
        @update:search="searchTimer"
        :loading="autocomplete_loading"
        :no-data-text="
            searchQuery.split('(')[0].trim().length < 3
                ? 'Es müssen mindestens 3 Buchstaben eingegeben werden.'
                : 'Es wurde kein passender Benutzer gefunden'
        "
    />
</template>
