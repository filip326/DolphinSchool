declare module "nuxt/schema" {
    interface RuntimeConfig {
        DB_NAME: string;
        DB_URL: string;
        prod: boolean;
        public: {
            DOMAIN: string;
        };
    }
}

export {};
