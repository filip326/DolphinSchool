<script lang="ts">
import { onMounted, ref } from "vue";
import format from "date-fns/format";
export default {
    name: "EMailPreview",
    props: {
        id: {
            type: String,
            required: true,
        },
        subject: {
            type: String,
            required: true,
        },
        sendby: {
            type: String,
            required: true,
        },
        timestemp: {
            type: Number,
            required: true,
        },
        unread: {
            type: Boolean,
            default: false,
        },
        stared: {
            type: Boolean,
            default: false,
        },
        flag: {
            type: String,
            default: "",
        },
    },
    data() {
        const width = ref(0);
        onMounted(() => {
            width.value = window.innerWidth;
            window.addEventListener("resize", () => {
                width.value = window.innerWidth;
            });
        });
        return {
            width,
            hover: false,
            read: !this.unread,
            star: this.stared,
        };
    },
    methods: {
        async markAsRead() {
            
        },
        onEmailSelected(email: string) {
            this.$emit("email_clicked", email);
        },
        async setStared() {
            
        },
        formatDate(date: number) {
            console.log(date);
            // when today, return time HH:mm
            if (format(date, "dd.MM.yyyy") === format(new Date(), "dd.MM.yyyy")) {
                return format(date, "HH:mm");
            }
            // when yesterday, return "Gestern"
            if (
                format(date, "dd.MM.yyyy") ===
                format(new Date(Date.now() - 24 * 60 * 60 * 1000), "dd.MM.yyyy")
            ) {
                return "Gestern";
            }
            // when last 6 days, return day of week
            if (date > Date.now() - 6 * 24 * 60 * 60 * 1000) {
                return format(date, "EEEE");
            }
            // else return date
            return format(date, "dd.MM.yyyy");
        },
    },
};
</script>

<template>
    <VContainer class="email-preview" v-if="width >= 900">
        <div class="read-unread">
            <!-- if message is already read -->
            <VBtn
                @click="markAsRead"
                density="comfortable"
                icon="mdi-email-open-outline"
                v-if="read || flag === 'outgoing'"
            >
            </VBtn>
            <!-- if message is not read yet -->
            <VBtn
                density="comfortable"
                icon="mdi-email-alert-outline"
                v-else
                class="unread"
                @click="markAsRead"
            >
            </VBtn>
        </div>
        <div class="sendby" @click="onEmailSelected(id)">
            {{ sendby }}
        </div>
        <div class="subject" @click="onEmailSelected(id)">
            {{ subject }}
        </div>
        <div class="time" @click="onEmailSelected(id)">
            {{ formatDate(timestemp) }}
        </div>
        <div class="starMail mail-button" v-if="flag !== 'outgoing'">
            <VBtn
                density="comfortable"
                variant="plain"
                elevation="0"
                class="delete"
                icon="mdi-star-outline"
                v-if="!star"
                @click="setStared"
            >
            </VBtn>
            <VBtn
                density="comfortable"
                variant="plain"
                elevation="0"
                class="delete"
                icon="mdi-star"
                v-else
                @click="setStared"
            >
            </VBtn>
        </div>
    </VContainer>
    <VContainer class="email-preview" v-if="width < 900">
        <div class="upper-line" @click="onEmailSelected(id)">
            <div class="read-unread">
                <!-- if message is already read -->
                <VBtn
                    density="comfortable"
                    icon="mdi-email-open-outline"
                    v-if="!unread || flag === 'outgoing'"
                >
                </VBtn>
                <!-- if message is not read yet -->
                <VBtn
                    density="comfortable"
                    icon="mdi-email-alert-outline"
                    v-else
                    class="unread"
                >
                </VBtn>
            </div>
            <div class="sendby">
                {{ sendby }}
            </div>
        </div>
        <div class="subject" @click="onEmailSelected(id)">
            {{ subject }}
        </div>
        <div class="lower-line">
            <div class="time">
                {{ formatDate(timestemp) }}
            </div>
            <div class="starMail mail-button" v-if="flag !== 'outgoing'">
                <VBtn
                    density="comfortable"
                    variant="plain"
                    elevation="0"
                    class="delete"
                    icon="mdi-star-outline"
                    v-if="!stared"
                >
                </VBtn>
                <VBtn
                    density="comfortable"
                    variant="plain"
                    elevation="0"
                    class="delete"
                    icon="mdi-star"
                    v-if="stared"
                >
                </VBtn>
            </div>
            <div class="deleteMail mail-button" v-if="flag !== 'outgoing'">
                <VBtn
                    @mouseover="hover = true"
                    @mouseleave="hover = false"
                    density="comfortable"
                    variant="plain"
                    elevation="0"
                    class="delete"
                    :icon="!hover ? 'mdi-delete' : 'mdi-delete-empty'"
                >
                </VBtn>
            </div>
        </div>
    </VContainer>
</template>

<style scoped>
.v-container {
    padding: 0;
    margin: 0;
    display: flex;
}

@media (min-width: 900px) {
    .v-container {
        flex-direction: row;
        align-items: center;
        gap: 10px;
    }

    .v-btn.unread {
        background-color: rgba(255, 0, 0, 0.6);
    }

    .read-unread {
        justify-self: left;
        margin: 0;
    }

    .upper-line {
        min-width: 100%;
        max-width: 100%;
    }

    .sendby {
        font-weight: bold;
        font-size: 18px;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 15%;
        white-space: nowrap;
    }

    .subject {
        font-size: 18px;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 50%;
        white-space: nowrap;
    }

    .time {
        opacity: 0.5;
        margin-left: auto;
        margin-right: 5px;
    }
}

@media (max-width: 899.9999px) {
    .v-container {
        flex-direction: column;
        justify-content: right;
        gap: 3px;
    }

    .upper-line,
    .lower-line {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;
    }

    .upper-line .unread {
        background-color: rgba(255, 0, 0, 0.6);
    }

    .sendby {
        white-space: nowrap;
        font-weight: bold;
    }

    .subject {
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }

    .time {
        color: #b5b5b5;
    }

    .starMail {
        margin-left: auto;
    }
}
</style>
