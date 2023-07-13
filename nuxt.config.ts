import { aliases, mdi } from "vuetify/iconsets/mdi";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    "nuxt-vuetify",
  ],
  vuetify: {
    icons: {
      defaultSet: "mdi",
      aliases: aliases,
      sets: {
        mdi: mdi
      }
    }, 
    theme: {
      defaultTheme: "dolphinTheme",
      themes: {
        dolphinTheme: {
          dark: true,
          colors: {
            background: "#222222", // Background-Color (dunkler)
            surface: "#525252", // Form-Background-Color (heller)
            primary: "#207178", // Darker-Dolphin-Color 
            secondary: "#50a4ab", // Lighter-Dolphin-Color
            error: "#ef2d13", // Rot
            info: "#2196f3", // Grün
            success: "#19c719", // Helles Blau
            warning: "#fb8200", // Orange
          }
        }

      },
    }
  }
})
