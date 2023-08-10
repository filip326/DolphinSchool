import Dolphin from "../Dolphin";
import { config } from "dotenv";
config();

import { mkdirSync, existsSync, appendFileSync, writeFileSync } from "fs";
import { format as formatDate } from "date-fns";
import { join } from "path";

const DATE_FORMAT_STR = "dd MM yyyy HH:mm:ss";
const FILE_FORMAT_STR = "yyyy-MM-dd";

type LogLevel =
    | "DEBUG" // Debug messages, are not saved in production. Valid for 10 minutes before removal.
    | "INFO" // Logs about normal events. Valid for 1 day before removal.
    | "AUDIT" // Changes to accounts, permissions or important objects. Valid for 1 month before removal.
    | "IMPORTANT" // Important audit messages. Valid for 3 months before removal.
    | "WARN" // Warnings about possible errors. Valid for 1 month before removal.
    | "ERROR" // Errors that are not critical. Valid for 1 month before removal.
    | "CRITICAL"; // Critical errors. Valid for 1 month before removal.

// any logable actions that can be logged (errors, changes, etc.) as a unique integer id
// e.g.
// AccountCreated = 0,
// AccountDeleted = 1,
enum Action {}

interface LogData {
    // the data that is passed to the logger
    level: LogLevel;

    action: Action;
    shortMessage: string; // a short message that is shown in the log list
    longMessage: string; // a long message that is shown when the log is opened

    causedBy: string; // the name of the user that caused the log
}

interface Log {
    // the data stored in the db
    level: LogLevel;

    action: Action;
    shortMessage: string; // a short message that is shown in the log list
    longMessage: string; // a long message that is shown when the log is opened

    causedBy: string; // the name of the user that caused the log

    deleteBy: number; // the timestamp when the log should be deleted
    archived: boolean; // if the log is archived, it will not be deleted
}

/**
 * Class used to Log messages and important events into an audit log.
 */
class Logger {
    static async log(data: LogData): Promise<void> {
        // get Dolphin class
        const dolphin = Dolphin.instance;
        if (!dolphin) {
            await Logger.logToFS(data);
            return;
        }

        // get the database
        const db = dolphin.database;

        // get the collection
        const collection = db.collection<Log>("logs");

        let deleteBy: number;

        // determine deleteBy value
        switch (data.level) {
            case "DEBUG":
                // in case of production, debug logs are not saved
                if (process.env.ENVIRONMENT === "prod") return;
                deleteBy = Date.now() + 1000 * 60 * 10; // 10 minutes
                break;
            case "INFO":
                deleteBy = Date.now() + 1000 * 60 * 60 * 24; // 1 day
                break;
            case "AUDIT":
                deleteBy = Date.now() + 1000 * 60 * 60 * 24 * 30; // 1 month
                break;
            case "IMPORTANT":
                deleteBy = Date.now() + 1000 * 60 * 60 * 24 * 30 * 3; // 3 months
                break;
            case "WARN":
                deleteBy = Date.now() + 1000 * 60 * 60 * 24 * 30; // 1 month
                break;
            case "ERROR":
                deleteBy = Date.now() + 1000 * 60 * 60 * 24 * 30; // 1 month
                break;
            case "CRITICAL":
                deleteBy = Date.now() + 1000 * 60 * 60 * 24 * 30; // 1 month
                break;
            default:
                deleteBy = Date.now() + 1000 * 60 * 60 * 24 * 30; // 1 month
                break;
        }

        // create the log
        const log: Log = {
            level: data.level,
            action: data.action,
            shortMessage: data.shortMessage,
            longMessage: data.longMessage,
            causedBy: data.causedBy,
            archived: false,
            deleteBy
        };

        // insert the log
        const dbResult = await collection.insertOne(log);
        if (!dbResult.acknowledged) {
            await Logger.logToFS(data);
            return;
        }

        // log successful
        return;
    }

    private static async logToFS(data: LogData): Promise<void> {
        // logs to the file system instead of the database
        // in case the database is not available
        // or the dolphin instance is not initialized

        // how an FS Log looks like:
        // 1. all string are url encoded
        // 2. different fields are separated by a semicolon
        // 3. the log is saved in the following format:
        //    level;action;shortMessage;longMessage;causedBy;deleteBy;archived
        // 4. each log is saved in a new line
        // 5. the log file is named in the following format:
        //    logs/dolphin-logs-<unix timestamp>.log
        // 6. each log file contains logs from at maximum 1 hour, beginning at the timestamp in the file name
        // 7. if a log file becomes empty due to log deletion, it is deleted as well
        // 8. after database connection is restored, all logs are to be inserted into the database and deleted from the FS asap

        // find a log file that is not older than 1 hour and has less than 100 lines
        // or create a new one
        // and append the log to it

        // get the directory where the logs are stored or create it if it does not exist

        if (!existsSync(join(".", ".logs"))) {
            mkdirSync(join(".", ".logs"));
        }

        // get all log files in the directory and filter out the ones that are older than 1 hour
        // const logFiles = readdirSync(join(".", ".logs")).filter((file) => {
        //     if (/^((.\/)?.logs\/)?dolphin-logs-[0-9]+\.log$/.test(file)) {
        //         const timestamp = parseInt(file.split("-")[2].split(".")[0]);
        //         if (Date.now() - timestamp < 1000 * 60 * 60) {
        //             return true;
        //         }
        //     }
        // });

        const path = join("logs", `${formatDate(new Date(), FILE_FORMAT_STR)}.log`);
        const toLog = this.buildLogStr(data);
        if (!existsSync("logs")) {
            mkdirSync("logs");
        }
        if (!existsSync(path)) {
            writeFileSync(path, `${formatDate(new Date(), DATE_FORMAT_STR)} Begin of log\n`);
        }
        appendFileSync(path, toLog, { encoding: "utf-8" });
    }

    private static buildLogStr(data: LogData): string {
        return `${data.level} [${formatDate(new Date(), DATE_FORMAT_STR)}] ${
            data.longMessage
        }\n ${JSON.stringify(data)}`;
    }
}

export default Logger;
