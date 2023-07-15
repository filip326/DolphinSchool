import Dolphin from "@/server/Dolphin/Dolphin";
import Session from "../Dolphin/Session/Session";
import User from "../Dolphin/User/User";
import Auth from "../types/auth";

export default defineEventHandler(async (event) => {
    try {
        const config = useRuntimeConfig();
        const authObject: any = await new Promise((resolve, _) => {
            new Dolphin(config.DB_URL, config.DB_URL, async (dolphin, success, error) => {
                if (success) {
                    let cookies = parseCookies(event);
                    let token = cookies?.token;
                    if (!token) {
                        const authObject: Auth = {
                            authenticated: false
                        };
                        return resolve(authObject);
                    }

                    // find the user in the sessions
                    const session = await dolphin.sessions?.findSession(token);
                    if (!session || !session[0] || !session[1]) {
                        const authObject: Auth = {
                            authenticated: false
                        };
                        return resolve(authObject);
                    }

                    let sesObj: Session = session[1];
                    let user = await dolphin.users?.findUser({ id: sesObj.userId });

                    if (!user || !user[0] || !user[1]) {
                        const authObject: Auth = {
                            authenticated: false
                        };
                        return resolve(authObject);
                    }

                    let usr: User = user[1];

                    const authObject: Auth = {
                        authenticated: true,
                        user: usr
                    };
                    return resolve(authObject);
                } else {
                    throw createError({
                        statusCode: 500,
                        message: "Error while loading dolphin",
                        data: error,
                    });
                }
            });
        });
        event.context.auth = authObject;
    } catch (error) {
        event.context.auth = {
            authenticated: false,
        };
        throw createError({
            statusCode: 503,
            message: "Error while authenticating",
            data: error,
        });
    }

    if (!event.context.auth.authenticated || !event.context.auth.user) {
        const publicRoutes = [
            "/",
        ];

        if (publicRoutes.includes(event.path) == false) {
            throw createError({
                statusCode: 401,
                message: "Unauthorized",
            });
        }
    }
});
