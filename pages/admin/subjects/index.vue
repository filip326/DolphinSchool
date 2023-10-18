<script lang="ts">
definePageMeta({
    layout: "default",
});
export default {
    data(): {
        visibleSubjects: {
            ud: string;
            short_name: string;
            name: string;
        }[];
        searchQuery: string;
    } {
        return {
            visibleSubjects: [],
            searchQuery: "",
        };
    },
    methods: {
        async loadSubjects() {},
        async search() {},
    },
};
</script>
<template>
    <h1>Fächer</h1>
    <VTextField v-model="searchQuery" label="Suche Fach" outlined dense @keyup.enter="search">
        <template #append>
            <VBtn
                title="create subject"
                link
                to="/admin/subjects/create"
                prependIcon="mdi-plus"
                color="primary"
                style="z-index: 1024"
            >
                Neues Fach
            </VBtn>
        </template>
    </VTextField>
    <VTable>
        <thead>
            <tr>
                <th>Abkürzung</th>
                <th>Fach</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="subject in visibleSubjects" :key="subject.ud">
                <td>{{ subject.short_name }}</td>
                <td>{{ subject.name }}</td>
            </tr>
        </tbody>
    </VTable>
</template>
