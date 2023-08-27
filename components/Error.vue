<script lang="ts">
type ErrorType = "http" | "api" | "other";

export default {
    props: {
        error: {
            type: Object,
            required: true,
        },
        type: {
            type: String as () => ErrorType,
            required: true,
        },
        fix: {
            type: String,
            required: false,
            default: "/",
        },
    },
    methods: {
        width(): string {
            if (window.innerWidth < 600) {
                return "100%";
            } else {
                return "50%";
            }
        },
        valError(): {
            statusCode: number;
            statusMessage: string;
            } {
            return {
                statusCode: this.error.statusCode ?? 500,
                statusMessage:
                    this.error.statusMessage ?? "Unknown Error. Please contact the support.",
            };
        },
    },
    computed: {
        title(): string {
            switch (this.type) {
                case "http":
                    return `${this.valError().statusCode} - ${this.valError().statusMessage}`;
                case "api":
                    return `${this.valError().statusCode} - ${this.valError().statusMessage}`;
                default:
                    return this.valError().statusMessage;
            }
        },
        text(): string {
            switch (this.type) {
                case "http":
                    return `HTTP Error: ${this.valError().statusMessage}}`;
                case "api":
                    return `API Error: ${this.valError().statusMessage}`;
                default:
                    return "Unknown Error Text";
            }
        },
        imgSrc(): string {
            if (this.error.statusCode) {
                return `https://http.cat/images/${this.error.statusCode}.jpg`;
            } else {
                return "https://http.cat/images/500.jpg";
            }
        },
    },
};
</script>

<template>
    <VCard border :width="width()" :max-width="width()" color="transparent" elevation="1">
        <VCardTitle>
            <h2>{{ title }}</h2>
        </VCardTitle>
        <VCardText>
            <p>{{ text }}</p>
        </VCardText>
        <VCardItem>
            <VImg :height="300" :src="imgSrc" />
        </VCardItem>
        <VCardText>
            <p>If this error persists, please contact the support or try again later.</p>
        </VCardText>
        <VCardActions>
            <VBtn variant="tonal" width="100%" @click="
                clearError({
                    redirect: fix
                })
                ">
                Zurück
            </VBtn>
        </VCardActions>
    </VCard>
</template>

<style scoped>
p {
    font-size: medium;
}
</style>
