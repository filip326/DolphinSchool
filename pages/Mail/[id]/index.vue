<template>
  <VCard>
    <VCardTitle>{{ $route.params.id }}<span class="author">von Autor</span></VCardTitle>

    <VCardText>
      <Markdown md="# Hello World" />
    </VCardText>
  </VCard>
</template>

<style scoped>
.v-card-title {
  font-size: 1.5em;
}

.author {
  font-size: 0.5em;
  margin: 0 20px;
}
</style>
