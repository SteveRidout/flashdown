import * as _ from "lodash";
import * as readline from "readline";

import { AppState, TextWithCursor } from "../types";
import * as homePage from "./homePage";
import * as sessionPage from "./sessionPage";
import * as ansiEscapes from "../ansiEscapes";

// Would be nice to do clever diffing here so that we only need to update what actually changed like
// React does, but for now it simply re-renders everything.

export const updateView = (appState: AppState) => {
  const textWithCursor: TextWithCursor = (() => {
    switch (appState.page.name) {
      case "home":
        return homePage.render(
          appState.homePageData,
          appState.fileName,
          appState.page
        );

      case "session":
        return sessionPage.render(appState.page);

      default:
        throw Error("Unknown page: " + appState.page);
    }
  })();

  const { text, cursorPosition } = textWithCursor;

  console.clear();
  console.log(text);

  process.stdout.clearScreenDown();

  if (cursorPosition) {
    readline.cursorTo(process.stdout, cursorPosition.x, cursorPosition.y);
    process.stdin.write(ansiEscapes.showCursor);
  } else {
    process.stdin.write(ansiEscapes.hideCursor);
  }
};
