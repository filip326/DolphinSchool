import FSLogger from "../../FSLogger/FSLogger";
import Dolphin from "../Dolphin";
import { format as formatDate } from "date-fns";

type LogLevel = "LOG" | "DEBUG" | "INFO" | "WARN" | "ERROR";

const DATE_FORMAT_STR = "dd MM yyyy HH:mm:ss";

interface ILog {
    name: string;
    level: LogLevel;
    msg: string;
    timestamp: string;
}

class DBLogger {
    static async log(name: string, level: LogLevel, msg: string): Promise<void> {
        try {
            const dolphin = (await Dolphin.instance) ?? (await Dolphin.init(useRuntimeConfig()));
            if (!dolphin) return FSLogger.log("Dolphin", "ERROR", "Dolphin is not initialized");
            const collection = dolphin.database.collection<ILog>("logs");
            const log: ILog = {
                name,
                level,
                msg,
                timestamp: formatDate(new Date(), DATE_FORMAT_STR)
            };
            await collection.insertOne(log);
        } catch {
            FSLogger.log("Dolphin", "ERROR", `Failed to log to DB: "${name} ${level} ${msg}"`);
        }
    }
}

export default DBLogger;
