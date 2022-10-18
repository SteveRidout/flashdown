/**
 * This module is responsible for reading and writing to Flashdown Practice Record (.fdr) files
 */
import * as fs from "fs";

import { Direction, Card, PracticeRecord } from "../types";

const parseDirection = (rawDirection: string): Direction => {
  switch (rawDirection) {
    case "f":
      return "front-to-back";
    case "b":
      return "back-to-front";
    default:
      throw Error("Unrecognized direction");
  }
};

const serializeDirection = (direction: Direction) => {
  switch (direction) {
    case "front-to-back":
      return "f";
    case "back-to-front":
      return "b";
  }
};

let writtenToLogFile = false;
export const writeRecord = (
  cardsFileName: string,
  card: Card,
  direction: Direction,
  success: number
) => {
  const fileName = getPracticeRecordFilename(cardsFileName);

  if (!fs.existsSync(fileName)) {
    fs.writeFileSync(fileName, "");
  }

  if (!writtenToLogFile) {
    let sessionHeader = "";
    if (
      fs.existsSync(fileName) &&
      fs.readFileSync(fileName).toString().length > 0
    ) {
      sessionHeader += "\n\n";
    }
    sessionHeader += `# ${currentDateTimeString()}\n`;
    fs.appendFileSync(fileName, sessionHeader);
    writtenToLogFile = true;
  }
  fs.appendFileSync(
    fileName,
    `\n${card.front}, ${serializeDirection(direction)}: ${success}`
  );
};

const currentDateTimeString = () => {
  const date = new Date();
  return `${date.getFullYear()}-${addZeroPadding(
    date.getMonth() + 1,
    2
  )}-${addZeroPadding(date.getDate(), 2)} ${addZeroPadding(
    date.getHours(),
    2
  )}:${addZeroPadding(date.getMinutes(), 2)}`;
};

const addZeroPadding = (value: number, totalDigits: number) => {
  let numberString = `${value}`;
  while (numberString.length < totalDigits) {
    numberString = `0${numberString}`;
  }
  return numberString;
};

const parseDateTimeString = (rawDateTime: string) => {
  const regExp = /([0-9]{4})-([0-9]{2})-([0-9]{2}) ([0-9]{2}):([0-9]{2})/;
  const match = regExp.exec(rawDateTime);

  if (!match) {
    throw Error("Datetime string not valid: " + rawDateTime);
  }

  const components: number[] = match
    .slice(1)
    .map((rawNumber) => parseInt(rawNumber, 10));

  return new Date(
    components[0],
    components[1] - 1,
    components[2],
    components[3],
    components[4]
  );
};

// XXX for now just one success value per line, but we could make this more compact and still just
// as readable (if not more readable) by including multiple success values per line
const practiceRecordRegexp = () => /^([^:]+), (f|b): ([0-5])/;

const getPracticeRecordFilename = (cardsFileName: string) => {
  // Remove .fd suffix from the card file name to get the base name
  const baseName = cardsFileName.endsWith(".fd")
    ? cardsFileName.substring(0, cardsFileName.length - 3)
    : cardsFileName;
  return `${baseName}.fdr`;
};

export const getRecords = (
  cardsFileName: string
): { [front: string]: { [direction: string]: PracticeRecord[] } } => {
  const skip = true;
  if (skip) {
    return {};
  }
  const fileName = getPracticeRecordFilename(cardsFileName);

  if (!fs.existsSync(fileName)) {
    return {};
  }

  const lines = fs
    .readFileSync(fileName)
    .toString()
    .split("\n")
    .filter((line) => line.trim().length > 0);

  // Should this be a Map instead to avoid the issue with certain keys on object?
  const practiceRecordsMap: {
    [front: string]: { [direction: string]: PracticeRecord[] };
  } = {};

  let currentDate: Date | undefined;
  for (const line of lines) {
    if (line.startsWith("# ")) {
      currentDate = parseDateTimeString(line.substring(2));
      continue;
    }

    const match = practiceRecordRegexp().exec(line);
    if (match) {
      if (!currentDate) {
        throw Error("No date associated with practice record");
      }

      const front = match[1];
      const direction = parseDirection(match[2]);
      const success = parseInt(match[3]);

      practiceRecordsMap[front] = practiceRecordsMap[front] ?? {
        "front-to-back": [],
        "back-to-front": [],
      };

      practiceRecordsMap[front][direction].push({
        practiceTime: Math.floor(currentDate?.getTime() / 1000 / 60),
        score: success,
      });
    }
  }

  return practiceRecordsMap;
};
