<script lang="ts">

export default {
    data() {
        return {
            search_class: "",
            timeout: null as NodeJS.Timeout | null,
        };
    },
    methods: {
        search() {
            console.log(this.search_class);
        },
        searchTimer() {
            if (this.timeout) {
                clearTimeout(this.timeout);
            }
            this.timeout = setTimeout(() => {
                this.search();
            }, 500);
        }
    }
};

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

            <VTextField v-model="search_class" append-inner-icon="mdi-magnify" @click:append-inner="search()"
                @update:model-value="searchTimer()" label="Suche" single-line hide-details />

            <VList>

                <VListItem to="/classes/id">

                    <div class="identifier-wrapper">
                        <VIcon>mdi-identifier</VIcon><span class="identifier">9-D-Kra-9a</span>
                    </div>
                    <div class="details-wrapper">
                        <div class="grade_level-wrapper">
                            <div class="grade_level-title">Jahrgang:</div><span class="grade_level">9</span>
                        </div>
                        <div class="teacher-wrapper">
                            <VIcon>mdi-human-male-board</VIcon><span class="teacher">Kra</span>
                        </div>
                        <div class="student_count-wrapper">
                            <VIcon>mdi-account-group</VIcon><span class="student_count">29</span>
                        </div>
                    </div>
                    <div class="details-wrapper">
                        <div class="homework">
                            <VIcon>mdi-home-alert</VIcon>
                            <span class="homework-title">3 Hausaufgaben</span>
                        </div>
                    </div>
                    <div class="details-wrapper">
                        <div class="absences">
                            <VIcon>mdi-alert</VIcon>
                            <span class="absences">3 unentschuldigte Fehlstunden</span>
                        </div>
                    </div>

                </VListItem>

            </VList>

        </VCardText>

    </VCard>
</template>

<style scoped>
.v-list-item {
    border: 1px solid white;
    border-radius: 5px;
}

.v-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 10px;
}

.identifier-wrapper {
    display: flex;
    align-items: center;
    justify-content: left;
    gap: 10px;
    border-radius: 5px 0 0 5px;
    font-size: 1.8em;
}

.details-wrapper {
    display: flex;
    gap: 15px;
    align-items: center;
    justify-content: left;

}

.details-wrapper>* {
    display: flex;
    align-items: center;
    gap: 5px;
}

.grade_level-title {
    font-weight: bold;
}
</style>