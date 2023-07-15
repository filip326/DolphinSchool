import Dolphin from "@/server/Dolphin/Dolphin";

export default eventHandler(async (event) => {
    try {
        const response: any = await new Promise((resolve, reject) => {
            new Dolphin("mongodb://127.0.0.1:27017", "DolphinSchool", async (dolphin, success, error) => {
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
