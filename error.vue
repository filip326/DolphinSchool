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
            <h1>
                {{ error?.statusCode || 'Error' }}
                {{  error?.name || 'Error' }}
            </h1>
            <p>
                {{ error?.message }}
                {{ error?.statusMessage }}
            </p>
        </NuxtLayout>
    </div>
</template>
