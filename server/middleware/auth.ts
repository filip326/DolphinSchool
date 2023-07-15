import Dolphin from "@/server/Dolphin/Dolphin";
import { navigateTo } from "nuxt/app";
import Session from "../Dolphin/Session/Session";
import User from "../Dolphin/User/User";
import Auth from "../types/auth";

export default defineEventHandler(async (event) => {
    try {
        const authObject: Auth = await new Promise((resolve, reject) => {
            new Dolphin("mongodb://127.0.0.1:27017", "DolphinSchool", async (dolphin, success, error) => {
                if (success) {
                    let cookies = parseCookies(event);
                    let token = cookies?.token;
                    if (!token) {
                        const authObject: Auth = {
                            authenticated: false
                        };
                        reject(authObject);
                    }

                    // find the user in the sessions
                    const session = await dolphin.sessions?.findSession(token);
                    if (!session || !session[0] || !session[1]) {
                        const authObject: Auth = {
                            authenticated: false
                        };
                        return reject(authObject);
                    }

                    let sesObj: Session = session[1];
                    let user = await dolphin.users?.findUser({ id: sesObj.userId });

                    if (!user || !user[0] || !user[1]) {
                        const authObject: Auth = {
                            authenticated: false
                        };
                        return reject(authObject);
                    }

                    let usr: User = user[1];

                    const authObject: Auth = {
                        authenticated: true,
                        user: usr
                    };
                    resolve(authObject);
                } else {
                    const authObject: Auth = {
                        authenticated: false
                    };
                    reject(authObject);
                }
            });
        });

        event.context.auth = authObject;
    } catch (error) {
        console.error(error);
        event.context.auth = {
            authenticated: false,
        };
    }

    if ((!event.context.auth.authenticated || !event.context.auth.user)) {
        const publicRoutes = [
            "/",
        ];

        if (!publicRoutes.includes(event.path)) {
            if (event.path.startsWith("/api")) {
                throw createError({
                    statusCode: 401,
                    message: "Unauthorized",
                });
            } else {
                if (!event.path.includes(".")) {
                    navigateTo("/");
                }
            }
        }
    }
});
