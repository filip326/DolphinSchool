<!-- instantly redirect to /mail/inbox -->
<script lang="ts">
export default {
    beforeCreate() {
        this.$router.push("/mail/inbox");
    },
};
</script>
