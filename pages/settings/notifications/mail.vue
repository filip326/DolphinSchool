<script lang="ts">

export default {
    async beforeCreate() {
        await checkAuth({
            redirectOnMfaRequired: true,
            redirectOnPwdChange: true,
            throwErrorOnNotAuthenticated: true,
        });
    },
};
