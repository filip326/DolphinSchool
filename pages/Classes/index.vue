<script lang="ts">

export default {
    data() {
        return {
            search_class: '',
            timeout: null as NodeJS.Timeout | null,
        }
    },
    methods: {
        search() {
            console.log(this.search_class)
        },
        searchTimer() {
            if (this.timeout) {
                clearTimeout(this.timeout)
            }
            this.timeout = setTimeout(() => {
                this.search()
            }, 500)
        }
    }
}

</script>

<template>
    <VCard>

        <VCardTitle>
            Klassen- und Kursmappen
        </VCardTitle>

        <VCardSubtitle>
            Klassen- und Kursmappen einsehen und verwalten
        </VCardSubtitle>

        <VCardText>

            <VTextField
                v-model="search_class"
                append-inner-icon="mdi-magnify"
                @click:append-inner="search()"
                @update:model-value="searchTimer()"
                label="Suche"
                single-line
                hide-details />

            <VSelect
                label="Filter"
                
            />

        </VCardText>

    </VCard>
</template>