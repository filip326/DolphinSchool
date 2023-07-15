# API

Here are all files returning JSON. File should look  like:

```ts
import Dolphin from "@/server/Dolphin/Dolphin";

export default eventHandler(async (event) => {
    try {
        const response: any = await new Promise((resolve, reject) => {
            new Dolphin("mongodb://127.0.0.1:27017", "DolphinSchool", async (dolphin, success, error) => {
                if (success) {
                    // todo
                    const response = {

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

```

**/*.get.ts => Get Request handler
**server/*.post.ts  => Postb Request handler
