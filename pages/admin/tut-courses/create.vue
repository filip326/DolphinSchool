<script lang="ts">
definePageMeta({
    layout: "default",
});
export default {
    data(): {
        teacherIds: string[];
        year: number | string;
        sek1: {
            className: string;
        };
        sek2: {
            tutName: string;
        };
        userIds: string[];
    } {
        return {
            year: 5,
            teacherIds: [],
            sek1: {
                className: "5",
            },
            sek2: {
                tutName: "",
            },
            userIds: [],
        };
    },
    methods: {
        validateClassNameSek1(v: string): boolean | string {
            if (!v.startsWith(this.year.toString())) {
                return "Klassennamen in der Sekundarstufe 1 müssen mit Jahrgangsstufe beginnen";
            }
            if (v.trim() === this.year.toString()) {
                return "Klassenname darf nicht nur aus Jahrgangsstufe bestehen";
            }
            return true;
        },
        async createClass() {
            // TODO: implement
        },
    },
};
</script>

<template>
    <h1>Neue Klasse / Tutorkurs erstellen</h1>

    <VCard>
        <VCardTitle> Allgemeines </VCardTitle>
        <VCardText>
            <VSelect
                label="Jahrgangsstufe"
                :items="[5, 6, 7, 8, 9, 10, 'E1/2', 'Q1/2', 'Q3/4']"
                v-model="year"
                required
                @update:model-value="sek1.className = year.toString()"
            ></VSelect>
            <SearchUser label="Lehrkraft" :limit="1" v-model:user_id="teacherIds" />
            <template v-if="typeof year === 'number' && year < 11">
                <VTextField
                    label="Klassenname"
                    :rules="[validateClassNameSek1]"
                    v-model="sek1.className"
                />
            </template>
            <template v-else>
                <VTextField label="Tutorenkursname" v-model="sek2.tutName" />
            </template>
        </VCardText>
    </VCard>
    <VCard>
        <VCardTitle> Schüler:innen hinzufügen </VCardTitle>
        <VCardText>
            Hier können Schüler:innen hinzugefügt werden. Dies können Sie auch später tun.
            <SearchUser label="Schüler:innen" v-model:user_id="userIds" />
        </VCardText>
        <VCardActions>
            <VBtn @click="createClass"> Klasse erstellen </VBtn>
        </VCardActions>
    </VCard>
</template>
