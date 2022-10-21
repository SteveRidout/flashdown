/**
 * This is responsible for keeping track of the flashdown files currently being used, it isn't
 * responsible for parsing or serializing to those files
 */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import * as debug from "../debug";
import { FilesStatus } from "../types";

let fileNames: string[] = [];

const flashdownDirectory = path.resolve(os.homedir(), ".flashdown");

let watchers: fs.FSWatcher[] = [];

export const readAndWatchFlashdownFileNamesInHomeDir = (
  updateCallback: (filesStatus: FilesStatus) => void
) => {
  if (!fs.existsSync(flashdownDirectory)) {
    updateCallback("files-found");
    return;
  }

  // Read all files in standard location: ~/.flashdown/notes.fd
  fileNames = fs
    .readdirSync(flashdownDirectory)
    .filter((fileName) => fileName.endsWith(".fd"))
    .map((fileName) =>
      path.resolve(os.homedir(), flashdownDirectory, fileName)
    );

  updateCallback("files-found");

  // Close existing watchers
  while (watchers.length > 0) {
    watchers.pop()?.close();
  }

  // If user changes any of the .fd file and we are showing home, update it
  for (const fileName of fileNames) {
    watchers.push(
      fs.watch(`${fileName}`, () => {
        readAndWatchFlashdownFileNamesInHomeDir(updateCallback);
      })
    );
  }

  watchers.push(
    fs.watch(flashdownDirectory, () => {
      readAndWatchFlashdownFileNamesInHomeDir(updateCallback);
    })
  );
};

export const init = (
  userProvidedFileName: string | undefined,
  updateCallback: (status: FilesStatus) => void
) => {
  if (userProvidedFileName === undefined) {
    // User didn't provide a filename, so look in the home directory
    readAndWatchFlashdownFileNamesInHomeDir(updateCallback);
    return;
  }

  initUserProvidedFile(userProvidedFileName, updateCallback);
};

const initUserProvidedFile = (
  userProvidedFileName: string,
  updateCallback: (status: FilesStatus) => void
) => {
  // Check for existence of the user provided filename
  if (fs.existsSync(userProvidedFileName)) {
    fileNames = [userProvidedFileName];
    updateCallback("files-found");
    return;
  }

  if (userProvidedFileName.endsWith(".fd")) {
    updateCallback("user-specified-file-not-found");
    return;
  }

  // Try again with the .fd extension
  initUserProvidedFile(`${userProvidedFileName}.fd`, updateCallback);
};

export const getFileNames = () => fileNames;

export const copyOnboardingExample = () => {
  const baseFileNames = ["hackerLaws", "cognitiveBiases"];
  const target = path.resolve(flashdownDirectory, "examples.fd");

  if (fs.existsSync(target)) {
    throw Error("File already exists: " + target);
  }

  for (const baseFileName of baseFileNames) {
    const source = path.resolve(
      __dirname,
      `../exampleFlashcards/${baseFileName}.fd`
    );

    if (!fs.existsSync(flashdownDirectory)) {
      fs.mkdirSync(flashdownDirectory);
    }

    const data = fs.readFileSync(source);
    fs.appendFileSync(target, data);
    fs.appendFileSync(target, "\n");
  }
};
