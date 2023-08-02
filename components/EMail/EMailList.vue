<script lang="ts">
export default {
    name: "EMailList",
    props: {
        url: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            emails: [
                {
                    id: "1",
                    subject: "Bug",
                    sendby: "1234567890123456789",
                    timestamp: "2023-05-05",
                    read: true,
                    stared: false
                },
                {
                    id: "2",
                    subject: "Testo Pestoq",
                    sendby: "langer Name - wirklich sehr lang",
                    timestamp: "2023-05-05",
                    read: true,
                    stared: false
                },
                {
                    id: "3",
                    subject: "lorem100",
                    sendby: "heeecker",
                    timestamp: "2023-05-05",
                    read: false,
                    stared: false
                },
                {
                    id: "4",
                    subject: "lorem100",
                    sendby: "heeecker",
                    timestamp: "2023-05-05",
                    read: true,
                    stared: false
                },
                {
                    id: "5",
                    subject: "lorem100",
                    sendby: "heeecker",
                    timestamp: "2023-05-05",
                    read: false,
                    stared: false
                },
                {
                    id: "6",
                    subject: "lorem100abcdefghijklmnopqrstuvw",
                    sendby: "heeecker",
                    timestamp: "2023-05-05",
                    read: false,
                    stared: false
                }
            ]
        };
    },
    methods: {
        onEmailSelected(email: string) {
            this.$emit("email_selected", email);
        },
        loadMore() {
            // todo
        }
    }
};
</script>

<template>
    <div>
        <VList bg-color="background">
            <VListItem
                variant="tonal"
                density="comfortable"
                v-for="email in emails"
                :key="email.id"
            >
                <EMailPreview
                    @email_clicked="onEmailSelected"
                    :id="email.id"
                    :sendby="email.sendby"
                    :unread="email.read"
                    :subject="email.subject"
                    :timestamp="email.timestamp"
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
}

.v-list-item:last-child {
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
}
</style>
