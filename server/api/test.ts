import Dolphin from "@/server/Dolphin/Dolphin";
import User from "../Dolphin/User/User";

export default eventHandler(async (event) => {
    try {
        const response: any = await new Promise((resolve, reject) => {
            new Dolphin("mongodb://127.0.0.1:27017", "DolphinSchool", async (dolphin, success, error) => {
                if (success) {
                    let users: string[] = [];
                    let usersRes = await dolphin.users?.list({})
                    if (usersRes && usersRes[0]) {
                        users = usersRes[0].map((user: User) => {
                            return user.username;
                        });
                    } else {
                        users = ["No users found"];
                    }
                    const response = {
                        dolphin: dolphin.ready,
                        users: users
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
        console.error(error);
        return { error: error };
    }
});
