declare module "nuxt/schema" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
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
