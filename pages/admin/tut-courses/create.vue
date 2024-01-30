<script lang="ts">
definePageMeta({
    layout: "default",
});
export default {
    data(): {
        teacherId: string[];
        year: number | string;
        sek1: {
            className: string;
        };
        sek2: {
            tutName: string;
        };
        userIds: string[];
        error: {
            shown: boolean;
            msg: string;
        };
        rules: Record<string, (v: unknown) => boolean | string>;
    } {
        return {
            year: 5,
            teacherId: [],
            sek1: {
                className: "5",
            },
            sek2: {
                tutName: "",
            },
            userIds: [],
            error: {
                shown: false,
                msg: "",
            },
            rules: {
                required: (v: unknown) => !!v || "Dieses Feld ist erforderlich",
            },
        };
    },
    methods: {
        setTeacherId(val: string[]) {
            console.log(val);
            this.teacherId = val;
        },
        setUserIds(val: string[]) {
            this.userIds = val;
        },
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
            if (!this.year || this.teacherId.length === 0) {
                console.log(
                    "year: ",
                    this.year,
                    "teacherId: ",
                    this.teacherId,
                    "userIds: ",
                    this.userIds,
                );
                this.error = {
                    shown: true,
                    msg: "Bitte füllen Sie alle Felder aus",
                };
                return;
            }

            const res = await useFetch("/api/admin/tut-courses/", {
                method: "POST",
                body: JSON.stringify({
                    year: this.year,
                    teacherId: this.teacherId,
                    userIds: this.userIds,
                    sek1: this.sek1,
                }),
            });

            if (res.status.value === "success") {
                await navigateTo("/admin/tut-courses");
                this.error.shown = false;
                return;
            } else {
                console.log(res.error.value);
                this.error = {
                    shown: true,
                    msg: "Fehler beim erstellen der neuen Klasse/ Tutorkurses",
                };
            }
        },
    },
};
</script>

<template>
    <h1>Neue Klasse/ Tutorkurs erstellen</h1>
    <VForm @submit.prevent="createClass()">
        <VCard>
            <VCardTitle> Allgemeines </VCardTitle>
            <VCardText>
                <VSelect
                    label="Jahrgangsstufe"
                    :items="[5, 6, 7, 8, 9, 10, 'E1/2', 'Q1/2', 'Q3/4']"
                    v-model="year"
                    :rules="[rules.required]"
                    @update:model-value="sek1.className = year.toString()"
                ></VSelect>
                <SearchUser label="Lehrkraft" :limit="1" v-model="teacherId" />
                <template v-if="typeof year === 'number' && year < 11">
                    <VTextField
                        label="Klassenname"
                        :rules="[validateClassNameSek1, rules.required]"
                        v-model="sek1.className"
                    />
                </template>
            </VCardText>
        </VCard>
        <VCard>
            <VCardTitle> Schüler:innen hinzufügen </VCardTitle>
            <VCardText>
                Hier können Schüler:innen hinzugefügt werden. Dies können Sie auch später
                tun.
                <SearchUser label="Schüler:innen" v-model="userIds" />
            </VCardText>
            <VAlert v-if="error.shown" type="error" title="Error" :text="error.msg" />
            <VCardActions>
                <VBtn type="submit" color="primary"> Klasse erstellen </VBtn>
            </VCardActions>
        </VCard>
    </VForm>
</template>
