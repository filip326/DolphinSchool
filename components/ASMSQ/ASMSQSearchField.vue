<script lang="ts">
export default {
    props: {
        multi: {
            type: Boolean,
            default: true,
        },
        label: {
            type: String,
            default: "Suche nach Benutzer, Klasse oder Kurs",
        },
        modelValue: {
            type: Array<string>,
            default: () => [],
        },
    },
    emits: ["update:modelValue"],
    data(): {
        searchText: string;
        suggestions: {
            label: string;
            value: string;
        }[];
        selected: string[];
        timeout: NodeJS.Timeout | null;
    } {
        return {
            searchText: "",
            suggestions: [],
            selected: [],
            timeout: null,
        };
    },
    methods: {
        async getSuggestions() {
            const response = await useFetch("/api/asmsq/suggest", {
                method: "get",
                query: {
                    s: this.searchText,
                },
            });
            if (response.status.value === "success")
                response.data.value?.forEach((v) => {
                    // check if suggestion with same value already exists
                    // if not, add it
                    if (!this.suggestions.find((s) => s.value === v.value))
                        this.suggestions.push(v);
                });

            // remove suggestions that are not selected (anymore) nor match the search text
            this.suggestions = this.suggestions.filter(
                (s) =>
                    this.selected.includes(s.value) ||
                    s.label.toLowerCase().includes(this.searchText.toLowerCase()) ||
                    s.value.toLowerCase().includes(this.searchText.toLowerCase()),
            );
        },
        whenTyping() {
            if (this.timeout) clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {
                this.getSuggestions();
            }, 700);
        },
    },
};
</script>

<template>
    <div>
        <VAutocomplete
            v-model="selected"
            v-model:search="searchText"
            chips
            closable-chips
            multiple
            :items="suggestions"
            item-title="label"
            item-value="value"
            :label="label"
            @input="whenTyping"
            @update:model-value="
                searchText = '';
                $emit('update:modelValue', selected);
            "
            no-data-text="Suche nach passenden Vorschlägen..."
        >
        </VAutocomplete>
    </div>
</template>

<style scoped></style>
