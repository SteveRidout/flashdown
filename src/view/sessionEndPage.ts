import chalk from "chalk";

import { TerminalViewModel } from "../types";
import * as actions from "../actions";
import _ from "lodash";

const pluralize = (word: string, amount: number) =>
  `${word}${amount === 1 ? "" : "s"}`;

export const render = (
  previousStreak: number,
  currentStreak: number
): TerminalViewModel => {
  const streakPrefix = "  Streak: ";

  return {
    textWithCursor: {
      lines: [
        "",
        "  Well done!",
        "",
        `${streakPrefix}${previousStreak}${
          currentStreak === previousStreak
            ? ` ${pluralize("day", currentStreak)}`
            : ""
        }`,
        "",
        chalk.cyanBright("  Hit SPACE to continue"),
      ],
    },
    animations:
      currentStreak === previousStreak
        ? []
        : [
            {
              type: "frames",
              position: {
                x: streakPrefix.length,
                y: 3,
              },
              frames: [
                ...animationFrames(previousStreak, currentStreak),
                `${currentStreak} (+${currentStreak - previousStreak})`,
              ],
              initialDelay: 500,
              frameDuration: 1000 / 12,
            },
          ],
    keyPressHandler: (_str, key) => {
      if (!["space", "return"].includes(key.name)) {
        return false;
      }
      actions.showHome();
      return true;
    },
  };
};

const animationFrames = (oldStreak: number, newStreak: number): string[] => {
  const oldString = oldStreak.toString();
  const newString = newStreak.toString();

  const updateFrames = [".", "-", "'"];

  return _.range(updateFrames.length).map((frameIndex) => {
    return newString
      .split("")
      .map((newCharacter, characterIndex) => {
        if (newCharacter === oldString[characterIndex]) {
          return newCharacter;
        }
        return updateFrames[frameIndex];
      })
      .join("");
  });
};
