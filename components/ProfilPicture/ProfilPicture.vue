<script lang="ts">
export default {
    props: {
        rounded: {
            type: Boolean,
            default: false,
        },
        img: {
            type: String,
            required: true,
        },
    },
    computed: {
        parsedImg(): Array<Array<string>> {
            const img = this.img;
            const parsedImg: Array<Array<string>> = [];
            const imgSplit = img.split(",");
            for (let i = 0; i < 32; i++) {
                parsedImg.push(imgSplit.slice(i * 32, (i + 1) * 32));
            }
            return parsedImg;
        },
    },
};
</script>

<template>
    <div :class="rounded ? 'rounded' : ''" class="img">
        <section :key="index" v-for="(_, index) in Array(32)">
            <div
                :style="{ background: color }"
                class="pixel"
                :key="i"
                v-for="(color, i) in parsedImg[index]"
            ></div>
        </section>
    </div>
</template>

<style scoped>
.img {
    width: 100%;
    height: auto;
    aspect-ratio: 1 / 1;
}

.img.rounded {
    border-radius: 50%;
}

.pixel {
    width: 100%;
    height: 100%;
}

section {
    width: 100%;
    height: calc(100% / 32);
    display: flex;
    flex-direction: row;
}
</style>
