import * as _ from "lodash";
import * as readline from "readline";
import chalk from "chalk";
import ansiRegex from "ansi-regex";

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
import config from "../config";
import * as keyboard from "../keyboard";

// Would be nice to do clever diffing here so that we only need to update what actually changed like
// React does, but for now it simply re-renders everything.

export const updateView = async (appState: AppState) => {
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

  renderToTerminal(terminalViewModel);

  if (terminalViewModel.keyPressHandler) {
    const { str, key } = await keyboard.readKeypress();
    terminalViewModel.keyPressHandler(str, key);
  }
};

/** Counts the number of renders we've done so far */
let renderCount = -1;

/** Animations running */
let animationsRunning = 0;
let previousCursorPosition: { x: number; y: number } | undefined;
let previousTextWithCursor: TextWithCursor = { lines: [] };

const normalizeLine = (line: string) => {
  const onScreenLength = line.replace(ansiRegex(), "").length;

  // XXX Would be good to also restrict the length of each line so that it can't exceed
  // config.maxColumnWidth
  return line + _.repeat(" ", config.maxColumnWidth - onScreenLength);
};

const renderToTerminal = async (model: TerminalViewModel) => {
  renderCount++;

  const { lines, cursorPosition } = model.textWithCursor;

  process.stdin.write(ansiEscapes.hideCursor);
  // console.clear();
  process.stdout.cursorTo(0, 0);

  if (renderCount === 0) {
    process.stdin.write(ansiEscapes.hideCursor);
    // The first time, present the lines one by one:
    for (const line of lines) {
      process.stdout.write(
        line
          .replace(ansiRegex(), "")
          .split("")
          .map(
            (character) => (character === " " ? " " : chalk.bgBlackBright("#")),
            config.maxColumnWidth
          )
          .join("")
      );
      await sleep(50);

      if (renderCount > 0) {
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
    readline.cursorTo(process.stdout, cursorPosition.x, cursorPosition.y);
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
          readline.cursorTo(
            process.stdout,
            previousCursorPosition.x,
            previousCursorPosition.y
          );
          process.stdin.write(ansiEscapes.showCursor);
        }
        return;
      }

      const currentRenderCount = renderCount;

      const delay =
        frameIndex === 0 ? animation.initialDelay : animation.frameDuration;

      await sleep(delay);

      if (renderCount > currentRenderCount) {
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
      ].map((x) => Math.round(x * config.maxColumnWidth) / 80);

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
          readline.cursorTo(
            process.stdout,
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
    const aLine = _.padEnd(aRange.lines[y] ?? "", config.maxColumnWidth, " ");
    const bLine = _.padEnd(bRange.lines[y] ?? "", config.maxColumnWidth, " ");

    lines.push(
      (aLine.substring(xOffset) + bLine).substring(0, config.maxColumnWidth)
    );
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
