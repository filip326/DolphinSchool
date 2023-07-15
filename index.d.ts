declare module 'nuxt/schema' {
    interface RuntimeConfig {
        DB_NAME: string;
        DB_URL: string;
        public: {
            DOMAIN: string;
        }
    }
}

export { }
