import * as _ from "lodash";
import chalk from "chalk";

import ansiRegex from "../ansiRegex";
import {
  Animation,
  AppState,
  TextWithCursor,
  TerminalViewModel,
} from "../types";
import * as alertModal from "./alertModal";
import * as homePage from "./homePage";
import * as sessionPage from "./sessionPage";
import * as sessionEndPage from "./sessionEndPage";
import * as onboardingPage from "./onboardingPage";
import * as ansiEscapes from "../ansiEscapes";
import { sleep } from "../utils";
import * as keyboard from "../keyboard";
import { getWidth } from "../terminalSize";
import * as debug from "../debug";

/**
 * Update the view based on the new app state.
 *
 * XXX It might be nice to do clever diffing so that we only need to update what actually changed
 * like React does, but for now it simply re-renders everything.
 */
export const updateView = async (
  appState: AppState,
  clearTerminal: boolean = false
) => {
  const terminalViewModel: TerminalViewModel = (() => {
    if (appState.modalMessage) {
      return alertModal.render(appState.modalMessage);
    }

    switch (appState.page.name) {
      case "home":
        return homePage.render(appState.homePageData, appState.page);

      case "session":
        return sessionPage.render(appState.page);

      case "session-end":
        return sessionEndPage.render(
          appState.page.previousStreak,
          appState.page.currentStreak
        );

      case "onboarding":
        return onboardingPage.render();

      default:
        throw Error("Unknown page: " + appState.page);
    }
  })();

  if (clearTerminal) {
    console.clear();
  }
  renderToTerminal(terminalViewModel);

  if (terminalViewModel.keyPressHandler) {
    let handled = false;
    do {
      const { str, key } = await keyboard.readKeypress();
      handled = terminalViewModel.keyPressHandler(str, key);
    } while (!handled);
  }
};

/** Counts the number of renders we've started so far */
let startedRenderingCount = 0;

/** Animations running */
let animationsRunning = 0;
let previousCursorPosition: { x: number; y: number } | undefined;
let previousTextWithCursor: TextWithCursor = { lines: [] };

/**
 * Adds padding so that the line takes up the full width and therefore will overwrite the entire
 * line from the previous render
 */
const normalizeLine = (line: string) => {
  const onScreenLength = line.replace(ansiRegex(), "").length;
  return line + _.repeat(" ", getWidth() - onScreenLength);
};

/**
 * Render the view model to the terminal, ensuring that no unintended artifacts remain from the
 * previous render
 */
const renderToTerminal = async (model: TerminalViewModel) => {
  startedRenderingCount++;

  if (startedRenderingCount === 1) {
    process.stdout.write(ansiEscapes.enableAlternativeBuffer);
  }

  const { lines, cursorPosition } = model.textWithCursor;

  process.stdin.write(ansiEscapes.hideCursor);
  process.stdout.cursorTo(0, 0);

  if (startedRenderingCount === 1) {
    process.stdin.write(ansiEscapes.hideCursor);
    // For the very first render, animate the lines appearing one by one from top to bottom:
    for (const line of lines) {
      process.stdout.write(
        line
          .replace(ansiRegex(), "")
          .split("")
          .map(
            (character) => (character === " " ? " " : chalk.bgBlackBright("#")),
            getWidth()
          )
          .join("")
      );
      await sleep(50);

      if (startedRenderingCount > 1) {
        // Abort animating if we are on the next render
        return;
      }

      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      console.log(normalizeLine(line));
    }
  } else {
    console.log(lines.map(normalizeLine).join("\n"));
  }

  process.stdout.clearScreenDown();

  if (cursorPosition) {
    process.stdout.cursorTo(cursorPosition.x, cursorPosition.y);
    process.stdin.write(ansiEscapes.showCursor);
  } else {
    process.stdin.write(ansiEscapes.hideCursor);
  }

  animationsRunning = model.animations.length;
  previousCursorPosition = cursorPosition;

  for (const animation of model.animations) {
    if (animation.type === "horizontal-pan") {
      // XXX These are disabled for now, since they don't work smoothly
      continue;
    }

    // Run animation
    runAnimation(animation, previousTextWithCursor, { lines, cursorPosition });
  }

  previousTextWithCursor = { lines, cursorPosition };
};

const runAnimation = async (
  animation: Animation,
  previous: TextWithCursor,
  current: TextWithCursor,
  frameIndex: number = 0
) => {
  switch (animation.type) {
    case "frames":
      if (frameIndex >= animation.frames.length) {
        // We're done
        animationsRunning--;
        // Check whether we need to update the cursor position
        if (animationsRunning === 0 && previousCursorPosition) {
          process.stdout.cursorTo(
            previousCursorPosition.x,
            previousCursorPosition.y
          );
          process.stdin.write(ansiEscapes.showCursor);
        }
        return;
      }

      const currentRenderCount = startedRenderingCount;

      const delay =
        frameIndex === 0 ? animation.initialDelay : animation.frameDuration;

      await sleep(delay);

      if (startedRenderingCount > currentRenderCount) {
        // Abort since a new render has been done since this animation started
        return;
      }

      process.stdout.cursorTo(animation.position.x, animation.position.y);
      process.stdout.write(animation.frames[frameIndex]);

      // Call recursively
      runAnimation(animation, previous, current, frameIndex + 1);
      break;

    case "horizontal-pan":
      const xOffsets = [
        0, 1, 1, 2, 3, 5, 7, 16, 25, 40, 55, 64, 73, 75, 77, 78, 79, 79, 80,
      ].map((x) => Math.round(x * getWidth()) / 80);

      if (frameIndex > xOffsets.length) {
        // We're done
        return;
      }

      await sleep(100);

      process.stdout.cursorTo(0, animation.yRange.start);
      // XXX This is a complete hack and will make yRange.end values not work properly
      process.stdout.clearScreenDown();

      if (frameIndex === xOffsets.length) {
        // Show final frame which is the untouched textWithCursor
        process.stdout.write(
          current.lines
            .slice(animation.yRange.start, animation.yRange.end + 1)
            .join("\n")
        );
        if (current.cursorPosition) {
          process.stdout.cursorTo(
            current.cursorPosition.x,
            current.cursorPosition.y
          );
          process.stdin.write(ansiEscapes.showCursor);
        }
        return;
      }

      process.stdout.write(
        createComposite(
          previous,
          current,
          animation.yRange,
          xOffsets[frameIndex]
        ).lines.join("\n")
      );
      process.stdin.write(ansiEscapes.hideCursor);

      runAnimation(animation, previous, current, frameIndex + 1);
      break;
  }
};

const createComposite = (
  a: TextWithCursor,
  b: TextWithCursor,
  yRange: { start: number; end: number },
  xOffset: number
): TextWithCursor => {
  const aRange = {
    lines: a.lines.slice(yRange.start, yRange.end + 1),
    // Intentionally not including cursor position in outgoing text
  };

  const bRange = {
    lines: b.lines.slice(yRange.start, yRange.end + 1),
    cursorPosition: b.cursorPosition
      ? {
          x: b.cursorPosition.x,
          y: b.cursorPosition.y - yRange.start,
        }
      : undefined,
  };

  const lines: string[] = [];

  for (let y = 0; y < Math.max(aRange.lines.length, bRange.lines.length); y++) {
    const aLine = _.padEnd(aRange.lines[y] ?? "", getWidth(), " ");
    const bLine = _.padEnd(bRange.lines[y] ?? "", getWidth(), " ");

    lines.push((aLine.substring(xOffset) + bLine).substring(0, getWidth()));
  }

  return {
    lines,
    cursorPosition: b.cursorPosition
      ? {
          x: b.cursorPosition.x + xOffset,
          y: b.cursorPosition.y,
        }
      : undefined,
  };
};
