<script setup lang="ts">
import { onMounted, ref } from "vue"
</script>

<script lang="ts">
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
        timestamp: {
            type: String,
            required: true,
        },
        unread: Boolean,
        stared: Boolean,
    },
    data() {
        const width = ref(0)
        onMounted(() => {
            width.value = window.innerWidth
            window.addEventListener("resize", () => {
                width.value = window.innerWidth
            })

        })
        return {
            width,
            hover: false,
        }
    },
    methods: {
        markAsRead() {
            return alert(this.id) // todo
        },
        deleteMail() {
            return alert(this.id) // todo
        },
        onEmailSelected(email: string) {
            this.$emit("email_clicked", email)
        },
    },
}
</script>

<template>
    <v-container class="email-preview" v-if="width >= 900">
        <div class="read-unread">
            <!-- if message is already read -->
            <v-btn density="comfortable" icon="mdi-email-open-outline" v-if="!unread"> </v-btn>
            <!-- if message is not read yet -->
            <v-btn density="comfortable" icon="mdi-email-alert-outline" v-if="unread" class="unread">
            </v-btn>
        </div>
        <div class="sendby" @click="onEmailSelected(id)">
            {{ sendby }}
        </div>
        <div class="subject" @click="onEmailSelected(id)">
            {{ subject }}
        </div>
        <div class="time" @click="onEmailSelected(id)">
            {{ timestamp }}
        </div>
        <div class="starMail mail-button">
            <v-btn density="comfortable" variant="plain" elevation="0" class="delete" icon="mdi-star-outline"
                v-if="!stared">
            </v-btn>
            <v-btn density="comfortable" variant="plain" elevation="0" class="delete" icon="mdi-star" v-if="stared">
            </v-btn>
        </div>
        <div class="deleteMail mail-button">
            <v-btn @mouseover="hover = true" @mouseleave="hover = false" density="comfortable" variant="plain" elevation="0"
                class="delete" :icon="!hover ? 'mdi-delete' : 'mdi-delete-empty'">
            </v-btn>
        </div>
    </v-container>
    <v-container class="email-preview" v-if="width < 900">
        <div class="upper-line" @click="onEmailSelected(id)">
            <div class="read-unread">
                <!-- if message is already read -->
                <v-btn density="comfortable" icon="mdi-email-open-outline" v-if="!unread">
                </v-btn>
                <!-- if message is not read yet -->
                <v-btn density="comfortable" icon="mdi-email-alert-outline" v-if="unread" class="unread">
                </v-btn>
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
                {{ timestamp }}
            </div>
            <div class="starMail mail-button">
                <v-btn density="comfortable" variant="plain" elevation="0" class="delete" icon="mdi-star-outline"
                    v-if="!stared">
                </v-btn>
                <v-btn density="comfortable" variant="plain" elevation="0" class="delete" icon="mdi-star" v-if="stared">
                </v-btn>
            </div>
            <div class="deleteMail mail-button">
                <v-btn @mouseover="hover = true" @mouseleave="hover = false" density="comfortable" variant="plain"
                    elevation="0" class="delete" :icon="!hover ? 'mdi-delete' : 'mdi-delete-empty'">
                </v-btn>
            </div>
        </div>
    </v-container>
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
