/**
 * This is responsible for keeping track of the flashdown files currently being used, it isn't
 * responsible for parsing or serializing to those files
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";

let fileNames: string[] = [];

const flashdownDirectory = path.resolve(os.homedir(), ".flashdown");

let watchers: fs.FSWatcher[] = [];

const readAndWatchFlashdownFileNamesInHomeDir = (
  updateCallback: (fileNames: string[]) => void
) => {
  // Read all files in standard location: ~/.flashdown/notes.fd
  fileNames = fs
    .readdirSync(path.resolve(os.homedir(), flashdownDirectory))
    .filter((fileName) => fileName.endsWith(".fd"))
    .map((fileName) =>
      path.resolve(os.homedir(), flashdownDirectory, fileName)
    );

  updateCallback(fileNames);

  // Close existing watchers:
  while (watchers.length > 0) {
    watchers.pop()?.close();
  }

  // If user changes any of the .fd file and we are showing home, update it...
  // XXX Should move to cardDAL to avoid breaking abstraction layer
  for (const fileName of fileNames) {
    watchers.push(
      fs.watch(`${fileName}`, () => {
        readAndWatchFlashdownFileNamesInHomeDir(updateCallback);
      })
    );
  }

  watchers.push(
    fs.watch(flashdownDirectory, (eventType, fileName) => {
      readAndWatchFlashdownFileNamesInHomeDir(updateCallback);
    })
  );
};

export const init = (
  userProvidedFileName: string | undefined,
  updateCallback: (fileNames: string[]) => void
) => {
  if (
    userProvidedFileName &&
    !fs.existsSync(userProvidedFileName) &&
    !userProvidedFileName.endsWith(".fd")
  ) {
    // Try adding .fd to see if that works
    userProvidedFileName += ".fd";
    if (fs.existsSync(userProvidedFileName)) {
      fileNames = [userProvidedFileName];
    }

    updateCallback([userProvidedFileName]);
    return;
  }

  // User didn't provide a filename, so look in home dir instead...

  readAndWatchFlashdownFileNamesInHomeDir(updateCallback);
};

export const getFileNames = () => fileNames;
