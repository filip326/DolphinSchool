import User from "@/server/Dolphin/User/User";

declare module "h3" {
    interface H3EventContext {
        auth: {
            authenticated: boolean;
            user?: User;
        };
    }
}

export { };
