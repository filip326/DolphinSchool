import { MongoClient } from "mongodb";

/**
 * @description the blocked passwords are checked as a RegExp to prevent to obvious passwords
 * @example "Riedberg" will block all passwords containing "Riedberg" (case insensitive), meaning "rIeDberg123" will be blocked as well
 */
const defaultBlockedPwdsStringArray: string[] = [
    "Riedberg",
    "Dolphin",
    "School",
    "Schule",
    "Passwort",
    "Password",
];

async function main() {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const DB_NAME = "DolphinSchool--DEV";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const DB_URL = "mongodb://127.0.0.1:27017/";

    const client = await MongoClient.connect(DB_URL);
    const db = client.db(DB_NAME);

    // create a { blockedPwd: string } Array from the defaultBlockedPwds
    const blockedPwdsObjArray = defaultBlockedPwdsStringArray.map((pwd) => ({ blockedPwd: pwd }));

    db.collection<{ blockedPwd: string }>("blockedPwds").insertMany(blockedPwdsObjArray);
}

main().then(() => {
    console.log("Done!");
    process.exit(0);
});
