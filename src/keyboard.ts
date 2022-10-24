import * as readline from "readline";

import * as ansiEscapes from "./ansiEscapes";
import { KeyPressInfo } from "./types";
import * as debug from "./debug";

readline.emitKeypressEvents(process.stdin);

process.stdin.setRawMode(true);
process.stdin.on("keypress", (str, key) => {
  // Allow user to exit with CTRL-C
  if (key.name === "c" && key.ctrl) {
    process.stdout.write(ansiEscapes.showCursor);
    process.stdout.write(ansiEscapes.disableAlternativeBuffer);
    process.exit();
  }

  if (onKeyPress?.(str, key)) {
    onKeyPress = undefined;
  }
});

let onKeyPress: ((str: string, key: KeyPressInfo) => void) | undefined;

export const readKeypress = (): Promise<{ str: string; key: KeyPressInfo }> =>
  new Promise<{ str: string; key: KeyPressInfo }>((resolve, _reject) => {
    onKeyPress = (str: string, key: KeyPressInfo) => {
      resolve({ str, key });
    };
  });
