<script lang="ts">
export default {
    data() {
        const rows = 32;
        const cols = 32;
        const initialColor = "#000000";
        const img = Array.from({ length: rows, }, () => Array(cols).fill(initialColor));

        return {
            img,
            color: initialColor,
            currentIndex: 0,
            currentI: 0,
            pixelBorder: true,
        };
    },
    methods: {
        updateColorPicker(index: number, i: number) {
            this.color = this.img[index][i];
            this.currentIndex = index;
            this.currentI = i;
        },
        setColor() {
            this.img[this.currentIndex][this.currentI] = this.color;
        },
    },
    watch: {
        color() {
            this.setColor();
        },
    },
};
</script>

<template>
    <VCard>
        <VCardText>
            <div class="img">
                <section :key="index" v-for="(_, index) in img">
                    <div
                        @click="updateColorPicker(index, i)"
                        :style="{
                            backgroundColor: color
                        }"
                        :class="pixelBorder ? 'pixelBorder' : ''"
                        class="pixel"
                        :key="i"
                        v-for="(color, i) in img[index]"
                    ></div>
                </section>
            </div>
        </VCardText>
        <VCardItem>
            <VColorPicker
                width="100%"
                swatches-max-height="200px"
                show-swatches
                :modes="['hex']"
                elevation="0"
                hide-sliders
                v-model="color"
            />
        </VCardItem>
        <VCardActions>
            <VBtn>Speichern</VBtn>
            <VBtn @click="pixelBorder = !pixelBorder">Hilfslinien</VBtn>
            <VBtn>Abbrechen</VBtn>
        </VCardActions>
    </VCard>
</template>

<style scoped>
.img {
    width: 100%;
    height: auto;
    aspect-ratio: 1 / 1;
}

.pixel {
    width: 100%;
    height: 100%;
    border-collapse: collapse;
}

.pixelBorder {
    border: 0.05px solid #fff;
}

section {
    width: 100%;
    height: calc(100% / 32);
    display: flex;
    flex-direction: row;
}
</style>
