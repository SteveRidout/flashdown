import chalk from "chalk";

import { TerminalViewModel } from "../types";
import * as renderUtils from "./renderUtils";
import * as flashdownFilesDAL from "../dal/flashdownFilesDAL";
import { getWidth } from "../terminalSize";

export const render = (): TerminalViewModel => {
  return {
    textWithCursor: renderUtils.indent(
      renderUtils.reflowText(
        {
          lines: [
            "Welcome to Flashdown!",
            "",
            "It looks like you don't have any flashcards yet. Let's fix that!",
            "",
            "Would you like to install 2 starter decks, one on Cognitive Biases and another on " +
              "common Hacker Laws?",
            "",
            "",
            chalk.cyanBright(
              "Hit SPACE to install these 2 starter decks to ~/.flashdown"
            ),
            "",
            chalk.gray(
              "(or, feel free to add .fd files of your own to ~/.flashdown instead)"
            ),
          ],
        },
        getWidth() - 2
      ),
      2
    ),
    animations: [],
    keyPressHandler: (_str, key) => {
      if (!["enter", "space"].includes(key.name)) {
        return false;
      }
      // Copy example file to user's home directory
      flashdownFilesDAL.copyOnboardingExample();
      flashdownFilesDAL.readAndWatchFlashdownFileNamesInHomeDir();
      return true;
    },
  };
};
