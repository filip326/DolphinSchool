import Dolphin from "@/server/Dolphin/Dolphin";

export default eventHandler(async (event) => {
    try {
        const config = useRuntimeConfig();
        const response: any = await new Promise((resolve, reject) => {
            new Dolphin(config.DB_URL, config.DB_NAME, async (dolphin, success, error) => {
                if (success) {
                    if (!event.context.auth.authenticated) {
                        return resolve({
                            error: "Not authenticated"
                        });
                    }
                    const response = {
                        user: JSON.stringify(event.context.auth.user),
                    };
                    resolve(response);
                } else {
                    const response = {
                        error: error
                    };
                    reject(response);
                }
            });
        });

        return response;
    } catch (error) {
        return {
            error: error
        };
    }
});
