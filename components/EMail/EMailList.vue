<script lang="ts">
export default {
    name: "EMailList",
    props: {
        url: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            emails: Array<{
                id: string;
                subject: string;
                content: string;
                sendBy: string;
                sentTo: string[];
                read?: boolean;
                stared?: boolean;
                timestamp: number;
            }>(),
        };
    },
    async beforeMount() {
        const res = await useFetch(this.url, {
            method: "GET",
        });

        if (res.status.value == "success") {
            this.emails = res.data.value.mails as Array<{
                id: string;
                subject: string;
                content: string;
                sendBy: string;
                sentTo: string[];
                read?: boolean;
                stared?: boolean;
                timestamp: number;
            }>;
        } else {
            throw createError({
                statusCode: 500,
                statusMessage: "Fehler beim Laden der E-Mails.",
                fatal: true,
            });
        }
    },
    methods: {
        async onEmailSelected(email: string) {
            await navigateTo("/mail/" + email);
        },
        UTCToStr(time: number): string {
            return new Date(time).toLocaleString();
        },
    },
};
</script>

<template>
    <div>
        <VList bg-color="background">
            <VListItem variant="tonal" density="comfortable" class="list-title-wrapper">
                <div class="list-title">{{ title }}</div>
            </VListItem>
            <VListItem
                variant="tonal"
                density="comfortable"
                v-for="email in emails"
                :key="email.id"
            >
                <EMailPreview
                    @email_clicked="onEmailSelected"
                    :id="email.id"
                    :sendby="email.sendBy"
                    :unread="email.read"
                    :subject="email.subject"
                    :timestamp="UTCToStr(email.timestamp)"
                    :stared="email.stared"
                />
            </VListItem>
        </VList>
    </div>
</template>

<style scoped>
.loadMoreBtn {
    width: 80%;
    max-width: 200px;
}

.v-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    height: 40px;
    margin-top: 20px;
}

.v-list {
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.v-list-item {
    overflow-y: hidden;
    height: min-content;
}

.v-list-item:first-child {
    margin-top: 5px;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
}

.v-list-item:last-child {
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
}

.list-title-wrapper {
    background-color: rgb(var(--v-theme-primary));
}

.list-title {
    font-weight: 600;
    font-size: 1.5em;
}
</style>
