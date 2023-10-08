import { aliases, mdi } from "vuetify/iconsets/mdi";

import { config } from "dotenv";
config();

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    runtimeConfig: {
        DB_NAME: process.env.DB_NAME ?? "DolphinSchool",
        DB_URL: process.env.DB_URL ?? "mongodb://127.0.0.1:27017/",
        // TODO: change to true for production
        //! WARNING: use false only in development, since it disables important security features
        prod: process.env.ENVIRONMENT === "production" ? true : false,
        public: {
            DOMAIN: process.env.DOMAIN ?? "http://127.0.0.1:3000/",
        },
    },
    app: {
        head: {
            charset: "utf-8",
            viewport: "width=device-width, initial-scale=1",
            noscript: [{ innerHTML: "This website requires JavaScript." }],
            titleTemplate: "DolphinSchool",
            meta: [
                {
                    hid: "description",
                    name: "description",
                    content: "Das Kommunikations-Tool für Schulen",
                },
                {
                    hid: "viewport",
                    name: "viewport",
                    content: "width=device-width, initial-scale=1, user-scalable=no",
                },
                // Open Graph
                { hid: "og:title", property: "og:title", content: "DolphinSchool" },
                { hid: "og:site_name", property: "og:site_name", content: "DolphinSchool" },
                { hid: "og:type", property: "og:type", content: "website" },
                {
                    hid: "og:url",
                    property: "og:url",
                    content: process.env.DOMAIN ?? "http://127.0.0.1:3000/",
                },
                { hid: "og:description", property: "og:description", content: "" },
                {
                    hid: "og:image",
                    property: "og:image",
                    content: `${process.env.DOMAIN ?? "http://127.0.0.1:3000/"}favicon.ico`,
                },
            ],
            link: [{ rel: "shortcut icon", type: "image/x-icon", href: "/favicon.ico" }],
        },
    },
    css: ["~/assets/base.css"],
    // todo Disable this for production
    //! WARNING: do not use with true in production
    devtools: { enabled: process.env.ENVIRONMENT === "production" ? false : true },
    ssr: process.env.SSR === "true" ? true : false,
    routeRules: {
        // Homepage pre-rendered at build time
        "/": { prerender: true, static: true },
        // Product page generated on-demand, revalidates in background
        // '/products/**': { swr: true },
        // Blog post generated on-demand once until next deploy
        // '/blog/**': { isr: true },
        // Admin dashboard renders only on client-side
        // '/admin/**': { ssr: false },
        // Add cors headers on API routes
        "/api/**": { cors: true },
        // Redirects legacy urls
        // '/old-page': { redirect: '/new-page' }
    },
    logLevel: process.env.ENVIRONMENT === "production" ? "silent" : "verbose",
    modules: ["nuxt-vuetify"],
    vuetify: {
        icons: {
            defaultSet: "mdi",
            aliases: aliases,
            sets: {
                mdi: mdi,
            },
        },
        theme: {
            defaultTheme: "dolphinTheme",
            themes: {
                dolphinTheme: {
                    dark: true,
                    colors: {
                        background: "#222222", // Background-Color (dunkler)
                        surface: "#0e0e0e", // Form-Background-Color (heller)
                        primary: "#207178", // Darker-Dolphin-Color
                        secondary: "#50a4ab", // Lighter-Dolphin-Color
                        error: "#ef2d13", // Rot
                        info: "#2196f3", // Grün
                        success: "#19c719", // Helles Blau
                        warning: "#fb8200", // Orange
                    },
                },
            },
        },
    },
});
