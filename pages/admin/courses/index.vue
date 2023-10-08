<script lang="ts">
export default {
    data(): {
        visibleStudents: {
            type: "student" | "teacher" | "parent";
            name: string;
            id: string;
            tutName: string;
        }[];
        page?: number;
        itemsPerPage?: number;
        pageCount?: number;
    } {
        return {
            visibleStudents: [],
            page: undefined,
            itemsPerPage: undefined,
            pageCount: undefined,
        };
    },
};
</script>

<template>
    <VTable>
        <thead>
            <tr>
                <th>Typ</th>
                <th>Name</th>
                <th>Klasse</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="student in visibleStudents" :key="student.id">
                <td>
                    <VIcon v-if="student.type == 'student'"> mdi-account </VIcon>
                    <VIcon v-else-if="student.type == 'teacher'"> mdi-account-tie </VIcon>
                    <VIcon v-else-if="student.type == 'parent'"> mdi-account-child </VIcon>
                </td>
                <td>{{ student.name }}</td>
                <td>{{ student.tutName }}</td>
            </tr>
        </tbody>
    </VTable>
</template>
