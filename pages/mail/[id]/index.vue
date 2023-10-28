<script lang="ts">
export default {
    async beforeCreate() {
        await checkAuth({
            redirectOnMfaRequired: true,
            throwErrorOnNotAuthenticated: true,
            redirectOnPwdChange: true,
        });
    },
    data() {
        return {
            email: {} as {
                id: string;
                subject: string;
                content: string;
                sendBy: string;
                sentTo: string[];
                read?: boolean;
                stared?: boolean;
                timestamp: number;
            },
        };
    },
    async beforeMount() {
        const id = this.$route.params.id;
        const res = await useFetch(`/api/mail/user/${id}`, {
            method: "GET",
        });

        if (res.status.value == "success") {
            this.email = res.data.value.mail as {
                id: string;
                subject: string;
                content: string;
                sendBy: string;
                sentTo: string[];
                read?: boolean;
                stared?: boolean;
                timestamp: number;
            };
        } else {
            throw createError({
                statusCode: 500,
                statusMessage: "Fehler beim Laden der Mail.",
                fatal: true,
            });
        }
    },
    methods: {
        UTCToStr(time: number): string {
            return new Date(time).toLocaleString();
        },
        async markAsRead() {
            const res = await useFetch(`/api/mail/user/${this.email.id}`, {
                method: "PATCH",
                body: JSON.stringify({
                    action: "read",
                    value: !this.email.read,
                }),
            });

            if (res.status.value === "success") {
                this.email.read = !this.email.read;
            }
        },
        async setStared() {
            const res = await useFetch(`/api/mail/user/${this.email.id}`, {
                method: "PATCH",
                body: JSON.stringify({
                    action: "star",
                    value: !this.email.stared,
                }),
            });

            if (res.status.value === "success") {
                this.email.stared = !this.email.stared;
            }
        },
    },
};
</script>

<template>
    <VCard>
        <VCardTitle>
            {{ email.subject }} von {{ email.sendBy }} an {{ email.sentTo.join(", ") }}
        </VCardTitle>

        <VCardSubtitle>
            {{ email.timestamp }}
        </VCardSubtitle>

        <VCardText>
            <VDivider></VDivider>
            <Markdown md="# Hello World" />
            <VDivider></VDivider>
        </VCardText>

        <VCardActions>
            <div class="read-unread">
                <!-- if message is already read -->
                <VBtn
                    @click="markAsRead"
                    density="comfortable"
                    icon="mdi-email-open-outline"
                    v-if="email.read"
                >
                </VBtn>
                <!-- if message is not read yet -->
                <VBtn
                    density="comfortable"
                    icon="mdi-email-alert-outline"
                    v-if="!email.read"
                    class="unread"
                    @click="markAsRead"
                >
                </VBtn>
            </div>
            <div class="starMail mail-button">
                <VBtn
                    density="comfortable"
                    variant="plain"
                    elevation="0"
                    class="delete"
                    icon="mdi-star-outline"
                    v-if="!email.stared"
                    @click="setStared"
                >
                </VBtn>
                <VBtn
                    density="comfortable"
                    variant="plain"
                    elevation="0"
                    class="delete"
                    icon="mdi-star"
                    v-if="email.stared"
                    @click="setStared"
                >
                </VBtn>
            </div>
        </VCardActions>
    </VCard>
</template>

<style scoped>
.v-card-title {
    font-size: 1.5em;
}

.author {
    font-size: 0.5em;
    margin: 0 20px;
}

@media (min-width: 900px) {
    .v-btn.unread {
        background-color: rgba(255, 0, 0, 0.6);
    }

    .read-unread {
        justify-self: left;
        margin: 0;
    }
}

@media (max-width: 899.9999px) {
    .unread {
        background-color: rgba(255, 0, 0, 0.6);
    }

    .starMail {
        margin-left: auto;
    }
}
</style>
