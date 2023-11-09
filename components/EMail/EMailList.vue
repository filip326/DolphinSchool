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
                sender: string;
                timestemp: number;
                stared: boolean;
                read: boolean;
                flag?: string;
            }>(),
        };
    },
    async beforeMount() {
        console.log(`loading emails from ${this.url}`);
        const res = await useFetch(this.url, {
            method: "GET",
        });

        if (res.status.value == "success") {
            console.log(res.data.value);
            this.emails = res.data.value as any as Array<{
                id: string;
                subject: string;
                sender: string;
                timestemp: number;
                stared: boolean;
                read: boolean;
                flag?: string;
            }>;
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
                    :sendby="email.sender"
                    :unread="!email.read"
                    :subject="email.subject"
                    :timestemp="email.timestemp"
                    :stared="email.stared"
                    :flag="email.flag"
                />
            </VListItem>
            <VListItem class="no_elements" v-if="emails.length === 0">
                <div class="no_elements_text">
                    <VIcon>mdi-magnify-scan</VIcon>
                    Keine E-Mails vorhanden.
                </div>
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

.no_elements {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 50px;
    background-color: rgb(var(--v-theme-surface));
}
.no_elements_text {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-size: 1.2em;
    font-weight: 600;
    color: rgb(var(--v-theme-text-primary));
}
.no_elements_text .v-icon {
    font-size: 5em;
}
</style>
