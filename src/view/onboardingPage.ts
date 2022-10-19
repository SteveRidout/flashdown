import chalk from "chalk";

import { TerminalViewModel } from "../types";
import config from "../config";
import * as renderUtils from "./renderUtils";

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
            chalk.cyanBright(
              "(or, feel free to add your own .fd file(s) to ~/.flashdown instead)"
            ),
          ],
        },
        config.maxColumnWidth - 2
      ),
      2
    ),
    animations: [],
  };
};
