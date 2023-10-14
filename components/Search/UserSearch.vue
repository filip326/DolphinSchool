<script lang="ts">
export default {
    name: "UserSearch",
    props: {
        user_id: {
            type: String,
            required: true,
        },
    },
    data(): {
        searchQuery: string;
        autocompleteItems: {
            label: string;
            id: string;
        }[];
        timeout: NodeJS.Timeout | null;
    } {
        return {
            searchQuery: "",
            autocompleteItems: [],
            timeout: null,
        };
    },
    methods: {
        async search() {
            if (this.searchQuery.length < 3) {
                return;
            }

            const response = await useFetch("/api/search/user", {
                method: "get",
                params: {
                    search: this.searchQuery,
                },
            });
            if (response.status.value !== "success") {
                return;
            }

            this.autocompleteItems = [];
            response.data.value!.map((user) => {
                this.autocompleteItems.push({
                    label: user.label,
                    id: user.id,
                });
            });
        },

        searchTimer() {
            // calls search after 1500 ms, except if another key is pressed. if another key is pressed, the timer is reset
            if (this.timeout !== null) {
                clearTimeout(this.timeout);
            }
            this.timeout = setTimeout(() => {
                this.search();
            }, 1500);
        },
    },
};
</script>

<template>
    <VAutocomplete
        v-model="searchQuery"
        :items="autocompleteItems"
        item-text="label"
        item-value="id"
        label="Suche nach Benutzer"
        outlined
        dense
        @change="searchTimer"
    />
</template>
