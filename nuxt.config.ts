// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    "nuxt-vuetify",
  ],
  vuetify: {
    theme: {
      defaultTheme: "dark",
    }
  }
})
