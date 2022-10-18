import chalk from "chalk";

import { TerminalViewModel } from "../types";

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
                y: 2,
              },
              frames: [
                ".",
                "-",
                "'",
                `${currentStreak} (+${currentStreak - previousStreak})`,
              ],
              initialDelay: 500,
              frameDuration: 1000 / 12,
            },
          ],
  };
};
