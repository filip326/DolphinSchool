<script lang="ts">
import format from "date-fns/format";
export default {
    data(): {
        email: {
            subject: string;
            timestamp: number;
            sendBy: string;
            sentTo: string;
            content: string;
        };
    } {
        return {
            email: {
                subject: "",
                timestamp: 0,
                sendBy: "",
                sentTo: "",
                content: "",
            },
        };
    },
    beforeCreate() {
        checkAuth({
            redirectOnMfaRequired: true,
            throwErrorOnNotAuthenticated: true,
            redirectOnPwdChange: true,
        });
        const id = this.$route.params.id;
        useFetch(`/api/mail/messages/${id}`, { method: "get" })
            .then((res) => {
                if (res.status.value === "success" && res.data.value) {
                    this.email = {
                        content: res.data.value.content,
                        timestamp: res.data.value.time,
                        sendBy: res.data.value.sender,
                        sentTo: res.data.value.receivers,
                        subject: res.data.value.subject,
                    };
                }
            })
            .catch(() => {
                // TODO: error handling
            });
    },
    methods: {
        UTCToStr(timestamp: number): string {
            // when it was today, show only the time (HH:MM)
            if (format(timestamp, "dd.MM.yyyy") === format(new Date(), "dd.MM.yyyy")) {
                return format(timestamp, "HH:mm");
            } // when it was yesterday, show text "Gestern, HH:MM"
            else if (
                format(timestamp, "dd.MM.yyyy") ===
                format(new Date(Date.now() - 86400000), "dd.MM.yyyy")
            ) {
                return `Gestern, ${format(timestamp, "HH:mm")}`;
            } // when it was in the past 6 days, show day and time
            else if (timestamp > Date.now() - 518400000) {
                return format(timestamp, "EEEE, HH:mm");
            } // else, show Date and time
            else {
                return format(timestamp, "yyyy-MM-hh, HH:mm");
            }
        },
    },
};
</script>

<template>
    <VCard>
        <VCardTitle> {{ email.subject }}</VCardTitle>

        <VCardSubtitle>
            {{ UTCToStr(email.timestamp) }}
        </VCardSubtitle>

        <VCardSubtitle>
            <span><b>Von:</b> {{ email.sendBy }}</span>
        </VCardSubtitle>

        <VCardSubtitle>
            <span><b>An:</b> {{ email.sentTo }}</span>
        </VCardSubtitle>

        <VCardText>
            <VDivider></VDivider>
            <Markdown :md="email.content" />
            <VDivider></VDivider>
        </VCardText>
    </VCard>
</template>

<style scoped>
.v-form .v-btn {
    padding: 0px 20px;
}

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
