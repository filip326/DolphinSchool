import { MongoClient } from "mongodb";
import { hash } from "bcrypt";

async function main() {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const DB_NAME = "DolphinSchool--DEV";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const DB_URL = "mongodb://127.0.0.1:27017/";

    const user = {
        username: "te.tester",
        fullName: "Test Tester",
        type: "student",
        password: await hash("password", 10),
        permissions: 1023, // max permission number at the moment (14.10.2023, 16:13)
        changePasswordRequired: true,
    };

    const client = await MongoClient.connect(DB_URL);
    const db = client.db(DB_NAME);

    await db.collection("users").insertOne(user);
}

main().then(() => {
    console.log("Done!");
    process.exit(0);
});
