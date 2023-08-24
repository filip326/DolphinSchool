import { MongoClient } from "mongodb";
import { hash } from "bcrypt";

async function main() {

    const DB_NAME = "DolphinSchool--DEV";
    const DB_URL = "mongodb://127.0.0.1:27017/";
    
    const user = {
        username: "te.tester",
        fullName: "Test Tester",
        type: "student",
        password: await hash("password", 10),
        permissions: 0
    };
    
    const client = await MongoClient.connect(DB_URL);
    const db = client.db(DB_NAME);
    
    db.collection("users").insertOne(user);

    console.log("Done!");
};

main();
process.exit(0);
