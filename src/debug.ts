import * as fs from "fs";

const logFile = "debugLog.txt";

export const log = (message: string) => {
  fs.appendFileSync(logFile, message + "\n");
};
