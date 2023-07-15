<script lang="ts">
export default {
    props: {
        error: Object
    }
}
</script>

<template>
    <div>
        <NuxtLayout>
            {{ 
                error?.message || 
                'An error occurred while trying to access the requested page.'
             }}
        </NuxtLayout>
    </div>
</template>
