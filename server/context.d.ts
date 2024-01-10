import Auth from "./types/auth";

declare module "h3" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface H3EventContext {
        auth: Auth;
    }
}

export {};
