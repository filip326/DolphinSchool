import Auth from "./types/auth";

declare module "h3" {
    interface H3EventContext {
        auth: Auth;
    }
}

export {};
