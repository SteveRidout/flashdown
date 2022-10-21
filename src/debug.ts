import * as fs from "fs";

const logFile = "debugLog.txt";

export const log = (message: string) => {
  const date = new Date();
  fs.appendFileSync(
    logFile,
    `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} ${message}\n`
  );
};
