<script lang="ts">
export default {
    async beforeCreate() {
        const checkAuthResult = await checkAuth({
            redirectOnMfaRequired: true,
            redirectOnPwdChange: true,
            throwErrorOnNotAuthenticated: true,
        });

        if (checkAuthResult.user.type !== "student") {
            throw createError({ statusCode: 403, statusMessage: "Forbidden" });
        }
    },
    data() {
        return {
            timetable: Array<
                Array<{
                    short: string;
                    long: string;
                    teacher: string;
                    freeHour?: boolean;
                }>
            >(5),
        };
    },
};
</script>

<template>
    <h2><VIcon>mdi-timetable</VIcon>Mein Stundenplan</h2>
    <VCard>
        <VTable>
            <THead>
                <tr>
                    <th class="text-left">Montag</th>
                    <th class="text-left">Dienstag</th>
                    <th class="text-left">Mittwoch</th>
                    <th class="text-left">Donnerstag</th>
                    <th class="text-left">Freitag</th>
                </tr>
            </THead>
            <TBody>
                <tr :key="dayindex" v-for="(day, dayindex) in timetable">
                    <td
                        :class="`${hour.short}` + (hour.freeHour ? 'free' : '')"
                        :key="hourindex"
                        v-for="(hour, hourindex) in day"
                        :title="hour.long"
                    >
                        <strong>{{ hour.short }}</strong> <br />
                        <span>{{ hour.teacher }}</span>
                    </td>
                </tr>
            </TBody>
        </VTable>
    </VCard>
</template>

<style scoped>
.v-icon {
    margin: 12px;
}
</style>
