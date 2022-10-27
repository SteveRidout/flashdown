import * as fs from "fs";

const logFile = "debugLog.txt";

/**
 * Appends a debugging message to the log file. This is used instead of console.log() since
 * Flashdown regularly clears the contents of the terminal.
 */
export const log = (message: string) => {
  const date = new Date();
  fs.appendFileSync(
    logFile,
    `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} ${message}\n`
  );
};
