import * as _ from "lodash";

import { WholeDate } from "./types";

export const sleep = (duration: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(), duration);
  });

export const wholeDate = (timeInMinutes: number): WholeDate => {
  const date = new Date(timeInMinutes * 60 * 1000);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
};

export const wholeDateToString = (wholeDate: WholeDate): string =>
  `${wholeDate.year}-${_.padStart(
    wholeDate.month.toString(),
    2,
    "0"
  )}-${_.padStart(wholeDate.day.toString(), 2, "0")}`;

export const wholeDateFromString = (rawWholeDate: string): WholeDate => {
  const [year, month, day] = rawWholeDate
    .split("-")
    .map((raw) => parseInt(raw, 10));

  return {
    year,
    month,
    day,
  };
};

export const wholeDatesAreEqual = (a: WholeDate, b: WholeDate): boolean =>
  a.year === b.year && a.month === b.month && a.day === b.day;

export const wholeDateAddDays = (
  wholeDate: WholeDate,
  days: number
): WholeDate => {
  const { year, month, day } = wholeDate;
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
};

/** Returns true if we are running from within a unit test */
export const inUnitTest = () => process.env.JEST_WORKER_ID !== undefined;
