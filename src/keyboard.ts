import * as readline from "readline";

import * as ansiEscapes from "./ansiEscapes";
import { KeyPressInfo } from "./types";

readline.emitKeypressEvents(process.stdin);

process.stdin.setRawMode(true);
process.stdin.on("keypress", (str, key) => {
  // Allow user to exit with CTRL-C
  if (key.name === "c" && key.ctrl) {
    process.stdout.write(ansiEscapes.showCursor);
    process.stdout.write(ansiEscapes.disableAlternativeBuffer);
    process.exit();
  }

  switch (state.type) {
    case "ignore":
      return;

    case "await-keypress":
      if (
        state.permittedKeys === undefined ||
        state.permittedKeys.includes(key.name)
      ) {
        state.onKeyPress(str, key);
        state = { type: "ignore" };
      }
      return;
  }
});

type State =
  | {
      type: "ignore";
    }
  | {
      type: "await-keypress";
      permittedKeys?: string[];
      onKeyPress: (str: string, key: KeyPressInfo) => void;
    };

let state: State = { type: "ignore" };

export const readKeypress = (
  permittedKeys?: string[]
): Promise<{ str: string; key: KeyPressInfo }> =>
  new Promise<{ str: string; key: KeyPressInfo }>((resolve, _reject) => {
    state = {
      type: "await-keypress",
      permittedKeys,
      onKeyPress: (str: string, key: KeyPressInfo) => {
        resolve({ str, key });
      },
    };
  });
