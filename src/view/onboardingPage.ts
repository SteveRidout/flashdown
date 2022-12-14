import { TerminalViewModel } from "../types";
import * as renderUtils from "./renderUtils";
import * as flashdownFilesDAL from "../dal/flashdownFilesDAL";

export const render = (): TerminalViewModel => {
  const builder = new renderUtils.TextWithCursorBuilder();

  builder.addText([
    "Welcome to Flashdown!",
    "",
    "It looks like you don't have any flashcards yet. Let's fix that!",
    "",
    "Would you like to install 2 starter decks, one on Cognitive Biases and another on " +
      "common Hacker Laws?",
    "",
    "",
  ]);
  builder.addText(
    "Hit SPACE to install these 2 starter decks to ~/.flashdown",
    "instruction"
  );
  builder.addText();
  builder.addText(
    "(or, feel free to add .fd files of your own to ~/.flashdown instead)",
    "subtle"
  );

  return {
    textWithCursor: builder.textWithCursor(),
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
