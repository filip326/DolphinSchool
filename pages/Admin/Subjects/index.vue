<script lang="ts" setup>
import { ref } from "vue";

definePageMeta({
    title: "Fächer",
    layout: "default",
});
</script>

<script lang="ts">
interface ISubject {
    longName: string;
    short: string;
    color: { r: number; g: number; b: number };
    main: boolean; // Hauptfach ja/nein
}

export default {
    async beforeMount() {
        await checkAuth({
            redirectOnMfaRequired: true,
            throwErrorOnNotAuthenticated: true,
            redirectOnPwdChange: true,
        });
    },
    data() {
        return {
            subjects: ref<ISubject[]>([]),
        };
    },
};
</script>

<template>
    <VCard>
        <VCardTitle> Fächer </VCardTitle>
        <VCardSubtitle> Hier können Sie Fächer verwalten. </VCardSubtitle>
        <VCardText>
            <VList>
                <VListItem
                    v-for="subject in subjects"
                    :key="subject.longName"
                    :title="subject.longName"
                    :subtitle="subject.short"
                />
            </VList>
        </VCardText>
    </VCard>
</template>
