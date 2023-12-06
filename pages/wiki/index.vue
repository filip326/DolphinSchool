<script lang="ts">
definePageMeta({
    title: "Wiki",
    layout: "default",
});

type WikiSpace = {
    name: string;
    description: string;
    url: string;
};

export default {
    data(): {
        state: "success" | "loading" | "error" | "empty";
        spaces: WikiSpace[];
    } {
        return {
            state: "loading",
            spaces: [],
        };
    },
    methods: {
        async loadSpaces() {
            const response = await useFetch("/api/wiki/spaces", {
                method: "get",
                key: Date.now().toString(),
            });
            if (response.status.value === "success") {
                this.spaces = response.data.value ?? [];
                if (this.spaces.length === 0) {
                    this.state = "empty";
                } else {
                    this.state = "success";
                }
            } else {
                this.state = "error";
            }
        },
    },
    beforeMount() {
        this.loadSpaces();
    },
};
</script>
<template>
    <h1>Wiki</h1>
    <h2>Bereiche</h2>
    <div class="loading-bar__wrapper" v-if="state === 'loading'">
        <VProgressLinear indeterminate class="loading-bar" />
    </div>
    <VCard v-else-if="state === 'error'">
        <div>
            <VIcon>mdi-alert</VIcon>
        </div>
        <div>
            <VCardTitle>Fehler</VCardTitle>
            <VCardText
                >Beim Laden der Wiki-Bereiche ist ein Fehler aufgetreten.</VCardText
            >
            <VCardActions>
                <VBtn @click="loadSpaces()" variant="flat" color="primary"
                    >Erneut versuchen</VBtn
                >
            </VCardActions>
        </div>
    </VCard>
    <VCard v-else-if="state === 'empty'">
        <div>
            <VIcon>mdi-magnify</VIcon>
        </div>
        <div>
            <VCardTitle>Nichts gefunden!</VCardTitle>
            <VCardText>Es wurden keine Wiki-Bereiche gefunden.</VCardText>
            <VCardActions>
                <VBtn variant="flat" color="primary"> Bereich erstellen </VBtn>
            </VCardActions>
        </div>
    </VCard>
    <VList v-else-if="state === 'success'">
        <VListItem
            v-for="space in spaces"
            :key="space.name"
            :to="`/wiki/${space.url}`"
            link
            ripple
        >
            <VListItemTitle>{{ space.name }}</VListItemTitle>
            <VListItemSubtitle>{{ space.description }}</VListItemSubtitle>
        </VListItem>
    </VList>
</template>
<style scoped>
.loading-bar__wrapper {
    width: auto;
    margin: 30px;
}

.v-card {
    display: flex;
    padding: 10px;
    align-items: baseline;
}
</style>
```
