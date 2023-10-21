<script lang="ts">
import getTextColorForBackgroundColor from "~/composables/getTextColorForBackgroundColor";
definePageMeta({
    layout: "default",
});
export default {
    data(): {
        visibleSubjects: {
            id: string;
            short_name: string;
            name: string;
            color: { r: number; g: number; b: number };
        }[];
        searchQuery: string;
    } {
        return {
            visibleSubjects: [],
            searchQuery: "",
        };
    },
    async beforeCreate() {
        await checkAuth({
            redirectOnMfaRequired: true,
            throwErrorOnNotAuthenticated: true,
            redirectOnPwdChange: true,
        });
    },
    methods: {
        async loadSubjects() {
            const response = await useFetch("/api/admin/subjects", { method: "get" });
            if (response.status.value === "success") {
                response.data.value!.forEach((subject) => {
                    this.visibleSubjects.push({
                        color: subject.color,
                        id: subject.id,
                        name: subject.name,
                        short_name: subject.shortName,
                    });
                });
            }
        },
        getTextColor(color: { r: number; g: number; b: number }) {
            return getTextColorForBackgroundColor(color);
        },
    },
};
</script>
<template>
    <h1>Fächer</h1>
    <VBtn
        title="create subject"
        link
        to="/admin/subjects/create"
        prependIcon="mdi-plus"
        color="primary"
        style="z-index: 1024"
    >
        Neues Fach
    </VBtn>
    <VTable>
        <thead>
            <tr>
                <th>Abkürzung</th>
                <th>Fach</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="subject in visibleSubjects" :key="subject.id">
                <td>
                    <div
                        :class="`subject-color`"
                        :style="`background-color: rgb(${subject.color.r}, ${subject.color.g}, ${
                            subject.color.b
                        }); color: ${getTextColor(subject.color)}`"
                    >
                        {{ subject.short_name }}
                    </div>
                </td>
                <td>{{ subject.name }}</td>
            </tr>
        </tbody>
    </VTable>
</template>

<style scoped>
.subject-color {
    padding: 10px 5px;
    margin: 5px;
    aspect-ratio: 1 / 1;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    font-weight: bolder;
    text-align: center;
}
</style>
