import { existsSync, writeFileSync, appendFileSync, mkdirSync } from "fs";
import { format as formatDate } from "date-fns";
import { join } from "path";

type LogLevel = "LOG" | "DEBUG" | "INFO" | "WARN" | "ERROR";

const DATE_FORMAT_STR = "dd MM yyyy HH:mm:ss";

class FSLogger {
    static log(name: string, level: LogLevel, msg: string): void {
        const path = join("logs", `${formatDate(new Date(), "yyyy-MM-dd--HH-mm-ss")}--${name}.log`);
        const toLog = this.buildLogStr(level, name, msg);
        if (!existsSync("logs")) {
            mkdirSync("logs");
        }
        if (!existsSync(path)) {
            writeFileSync(
                path,
                `${formatDate(new Date(), DATE_FORMAT_STR)} Begin of log ${name}\n`
            );
        }
        appendFileSync(path, toLog, { encoding: "utf-8" });
    }

    private static buildLogStr(type: LogLevel, name: string, text: string): string {
        return `${type} [${name} ${formatDate(new Date(), DATE_FORMAT_STR)}] ${text}\n`;
    }
}

export default FSLogger;
