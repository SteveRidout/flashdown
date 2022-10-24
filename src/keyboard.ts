import * as readline from "readline";

import * as ansiEscapes from "./ansiEscapes";
import { KeyPressInfo } from "./types";

readline.emitKeypressEvents(process.stdin);

/** Time to leave keypresses on the queue before discarding them */
const ttl = 1000;

let queue: {
  str: string;
  key: KeyPressInfo;
  /** Time since epoch (ms) */
  time: number;
}[] = [];

process.stdin.setRawMode(true);
process.stdin.on("keypress", (str, key) => {
  // Allow user to exit with CTRL-C
  if (key.name === "c" && key.ctrl) {
    process.stdout.write(ansiEscapes.showCursor);
    process.stdout.write(ansiEscapes.disableAlternativeBuffer);
    process.exit();
  }

  if (onKeyPress) {
    onKeyPress(str, key);
    onKeyPress = undefined;
  } else {
    queue.push({ str, key, time: new Date().getTime() });
  }
});

let onKeyPress: ((str: string, key: KeyPressInfo) => void) | undefined;

export const readKeypress = (): Promise<{ str: string; key: KeyPressInfo }> =>
  new Promise<{ str: string; key: KeyPressInfo }>((resolve, _reject) => {
    onKeyPress = (str: string, key: KeyPressInfo) => {
      const currentTime = new Date().getTime();

      while (queue.length > 0) {
        const nextQueuedItem = queue[0];
        queue = queue.slice(1);
        if (currentTime - nextQueuedItem.time < ttl) {
          // Handle queued keystroke
          resolve({ str: nextQueuedItem.str, key: nextQueuedItem.key });
          return;
        }
      }

      resolve({ str, key });
    };
  });
