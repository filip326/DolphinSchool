<script lang="ts">
export default {
    props: {
        multi: {
            type: Boolean,
            default: true,
        },
    },
    data(): {
        searchText: string;
        suggestions: {
            label: string;
            value: string;
        }[];
        selected: string[];
    } {
        return {
            searchText: "",
            suggestions: [],
            selected: [],
        };
    },
    methods: {},
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
        >
        </VAutocomplete>
    </div>
</template>

<style scoped></style>
