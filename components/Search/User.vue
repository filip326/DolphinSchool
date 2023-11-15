<script lang="ts">
export default {
    props: {
        label: {
            type: String,
            required: false,
        },
        limit: {
            type: Number,
            required: false,
        },
        exclude: {
            type: Array<string>,
            default: [],
        },
    },
    data(): {
        searchQuery: string;
        modelValue: string[];
        autocompleteItems: {
            label: string;
            id: string;
        }[];
        timeout: NodeJS.Timeout | null;
        autocomplete_loading: boolean;
    } {
        return {
            modelValue: [],
            searchQuery: "",
            autocompleteItems: [],
            timeout: null,
            autocomplete_loading: false,
        };
    },
    methods: {
        clearSearchOptionsAfterSelect() {
            this.autocompleteItems = [
                ...this.autocompleteItems.filter((i) => this.modelValue.includes(i.id)),
            ];
        },
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
                ...response.data.value!.map((user) => ({
                    label: user.label,
                    id: user.id,
                })),
                ...this.autocompleteItems.filter((i) => this.modelValue.includes(i.id)),
            ];

            // filter out duplicates
            this.autocompleteItems = this.autocompleteItems.filter(
                (item, index, self) => index === self.findIndex((t) => t.id === item.id),
            );
        },

        searchTimer() {
            if (this.limit && this.modelValue.length >= this.limit) {
                // if limit is reached, do not search
                // also display warning message
                return;
            }
            const searchTerm = this.searchQuery.split("(")[0].trim();
            if (searchTerm.length < 3) {
                if (this.modelValue.length === 0) this.autocompleteItems = [];
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
        customFilter(
            itemTitle: string,
            queryText: string,
            item: { label: string; value: string },
        ) {
            if (this.limit && this.modelValue.length >= this.limit) {
                return false;
            }
            if (this.exclude.includes(item.value)) {
                return false;
            }
            const searchTerm = queryText.split("(")[0].trim();
            return itemTitle.toLowerCase().includes(searchTerm.toLowerCase());
        },
    },
    watch: {
        modelValue(newVal: string[]) {
            if (this.limit && newVal.length > this.limit) {
                this.modelValue = newVal.slice(0, this.limit);
            }
            this.$emit("user-ids", this.modelValue);
        },
    },
};
</script>

<template>
    <VAutocomplete
        v-model="modelValue"
        v-model:search="searchQuery"
        :items="autocompleteItems"
        item-title="label"
        item-value="id"
        :custom-filter="() => true"
        :label="label ?? 'Suche nach Benutzer'"
        outlined
        dense
        @update:search="searchTimer"
        @update:model-value="
            searchQuery = '';
            clearSearchOptionsAfterSelect();
        "
        :counter="limit"
        :multiple="true"
        :chips="true"
        closable-chips
        :loading="autocomplete_loading"
        :no-data-text="
            limit && modelValue.length >= limit
                ? 'Maximale Anzahl an Benutzern erreicht'
                : searchQuery.split('(')[0].trim().length < 3
                ? 'Es müssen mindestens 3 Buchstaben eingegeben werden.'
                : 'Es wurde kein passender Benutzer gefunden'
        "
    />
</template>
