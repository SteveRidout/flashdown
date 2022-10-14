import * as _ from "lodash";
import * as readline from "readline";

import { Animation, AppState, TerminalViewModel } from "../types";
import * as alertModal from "./alertModal";
import * as homePage from "./homePage";
import * as sessionPage from "./sessionPage";
import * as sessionEndPage from "./sessionEndPage";
import * as ansiEscapes from "../ansiEscapes";
import * as debug from "../debug";

// Would be nice to do clever diffing here so that we only need to update what actually changed like
// React does, but for now it simply re-renders everything.

export const updateView = (appState: AppState) => {
  const terminalViewModel: TerminalViewModel = (() => {
    if (appState.modalMessage) {
      return alertModal.render(appState.modalMessage);
    }

    switch (appState.page.name) {
      case "home":
        return homePage.render(
          appState.homePageData,
          appState.fileName,
          appState.page
        );

      case "session":
        return sessionPage.render(appState.page);

      case "session-end":
        return sessionEndPage.render(
          appState.page.previousStreak,
          appState.page.currentStreak
        );

      default:
        throw Error("Unknown page: " + appState.page);
    }
  })();

  renderToTerminal(terminalViewModel);
};

/** Counts the number of renders we've done so far */
let renderCount = 0;

const renderToTerminal = (model: TerminalViewModel) => {
  const { lines, cursorPosition } = model.textWithCursor;

  console.clear();
  console.log(lines.join("\n"));

  process.stdout.clearScreenDown();

  if (cursorPosition) {
    readline.cursorTo(process.stdout, cursorPosition.x, cursorPosition.y);
    process.stdin.write(ansiEscapes.showCursor);
  } else {
    process.stdin.write(ansiEscapes.hideCursor);
  }

  renderCount++;

  for (const animation of model.animations) {
    debug.log("run animation: " + JSON.stringify(animation));
    // Run animation
    runAnimation(animation);
  }
};

const runAnimation = (animation: Animation, frameIndex: number = 0) => {
  if (frameIndex >= animation.frames.length) {
    // We're done
    return;
  }

  const currentRenderCount = renderCount;

  const delay =
    frameIndex === 0 ? animation.initialDelay : animation.frameDuration;

  setTimeout(() => {
    if (renderCount > currentRenderCount) {
      // Abort since a new render has been done since this animation started
      return;
    }

    process.stdout.cursorTo(animation.position.x, animation.position.y);
    process.stdout.write(animation.frames[frameIndex]);
    // Call recursively
    runAnimation(animation, frameIndex + 1);
  }, delay);
};
