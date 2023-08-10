import Dolphin from "../Dolphin";
import { config } from "dotenv";
config();

import {
    mkdirSync,
    existsSync,
    appendFileSync,
    writeFileSync,
    readdirSync,
    readFileSync,
    unlinkSync
} from "fs";
import { format as formatDate } from "date-fns";
import { join } from "path";

const DATE_FORMAT_STR = "dd MM yyyy HH:mm:ss";

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
enum Action {
    DolphinUNDEFINED = 0
}

interface LogData {
    // the data that is passed to the logger
    level: LogLevel;

    action: Action;
    shortMessage: string; // a short message that is shown in the log list
    longMessage: string; // a long message that is shown when the log is opened

    causedBy: string; // the name of the user that caused the log
}

interface Log {
    // the data that is stored in the database
    timestamp: number;

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
    private static async deleteLogs(): Promise<void> {
        // get Dolphin class
        const dolphin = Dolphin.instance;
        if (!dolphin) {
            await Logger.logToFS({
                level: "ERROR",
                action: Action.DolphinUNDEFINED,
                shortMessage: "Dolphin is undefiend",
                longMessage: "Dolphin is undefined",
                causedBy: "Logger.getLogs"
            });
            return;
        }

        // get the database
        const db = dolphin.database;

        // get the collection
        const collection = db.collection<Log>("logs");

        // drop all logs, where deleteBy is smaller than now
        await collection.deleteMany({
            deleteBy: {
                $lte: Date.now()
            }
        });
    }

    static async getLogs(from: Date, to: Date = new Date()) {
        // get Dolphin class
        const dolphin = Dolphin.instance;
        if (!dolphin) {
            await Logger.logToFS({
                level: "ERROR",
                action: Action.DolphinUNDEFINED,
                shortMessage: "Dolphin is undefiend",
                longMessage: "Dolphin is undefined",
                causedBy: "Logger.getLogs"
            });
            return;
        }

        // get the database
        const db = dolphin.database;

        // get the collection
        const collection = db.collection<Log>("logs");

        this.deleteLogs();

        // get the logs
        const logs = await collection
            .find({
                timestamp: {
                    $gte: from.getTime(),
                    $lte: to.getTime()
                }
            })
            .toArray();

        return logs;
    }

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
            timestamp: Date.now(),
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
        //    level;action;shortMessage;longMessage;causedBy;
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
        const logFiles = readdirSync(join(".", ".logs")).filter((file: any) => {
            if (/^((.\/)?.logs\/)?dolphin-logs-[0-9]+\.log$/.test(file)) {
                const timestamp = parseInt(file.split("-")[2].split(".")[0]);
                if (Date.now() - timestamp < 1000 * 60 * 60) {
                    return true;
                }
            }
        });

        // go through all log files and go through all lines in each log file and put them into the database
        // if the database connection is restored
        for (const file of logFiles) {
            // read the file
            const content = readFileSync(join(".", ".logs", file), { encoding: "utf-8" });
            // split the file into lines
            const lines = content.split("\n");
            // go through all lines
            for (let line of lines) {
                // remove "\n" and "\r" from the line
                line = line.replace("\n", "").replace("\r", "");

                // split the line into the different fields
                const fields = line.split(";");
                // decode the fields
                const decodedFields = fields.map((field) => decodeURIComponent(field));

                // create the log data
                const logData: LogData = {
                    level: decodedFields[0] as LogLevel,
                    action: decodedFields[1] as unknown as Action,
                    shortMessage: decodedFields[2],
                    longMessage: decodedFields[3],
                    causedBy: decodedFields[4]
                };

                // log the data to the database
                await Logger.log(logData);
            }

            // delete the file
            unlinkSync(join(".", ".logs", file));
        }

        const path = this.buildLogPath();
        if (!existsSync("logs")) {
            mkdirSync("logs");
        }

        const toLog = this.buildLogStr(data);
        appendFileSync(path, toLog, { encoding: "utf-8" });
    }

    private static buildLogStr(data: LogData): string {
        // return level;action;shortMessage;longMessage;causedBy;
        return (
            encodeURIComponent(
                `${data.level};${data.action};${data.shortMessage};${data.longMessage};${data.causedBy};`
            ) + "\n"
        );
    }

    private static buildLogPath(): string {
        // check if a log file exists that is not older than 1 hour and has less than 100 lines
        // if so, append the log to it
        // if not, create a new one and append the log to it

        // get all log files in the directory and filter out the ones that are older than 1 hour
        const logFiles = readdirSync(join(".", ".logs")).filter((file: any) => {
            if (/^((.\/)?.logs\/)?dolphin-logs-[0-9]+\.log$/.test(file)) {
                const timestamp = parseInt(file.split("-")[2].split(".")[0]);
                if (Date.now() - timestamp < 1000 * 60 * 60) {
                    return true;
                }
            }
        });

        // if there is a log file that is not older than 1 hour and has less than 100 lines, return it
        if (logFiles.length > 0) {
            return join(".", ".logs", logFiles[0]);
        }

        // if there is no log file that is not older than 1 hour and has less than 100 lines, create a new one
        const timestamp = Date.now();
        const path = join(".", ".logs", `dolphin-logs-${timestamp}.log`);
        writeFileSync(path, `${formatDate(new Date(), DATE_FORMAT_STR)} Begin of log\n`);
        return path;
    }
}

export default Logger;
