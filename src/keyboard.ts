import * as readline from "readline";

import * as ansiEscapes from "./ansiEscapes";

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
      if (state.permittedKeys.includes(key.name)) {
        state.onKeyPress(key.name);
        state = { type: "ignore" };
      }
      return;

    case "await-line": {
      let { input, cursorPosition } = state;
      if (key.name === "backspace") {
        if (input.length > 0) {
          input =
            input.substring(0, cursorPosition - 1) +
            input.substring(cursorPosition);
          cursorPosition = Math.max(0, cursorPosition - 1);
        }
      } else if (key.name === "left") {
        cursorPosition = Math.max(0, cursorPosition - 1);
      } else if (key.name === "right") {
        cursorPosition = Math.min(input.length, cursorPosition + 1);
      } else if (key.name === "enter" || key.name === "return") {
        console.log("DONE: ", input);
        state.onLineSubmitted(input);
        state = { type: "ignore" };
        return;
      } else if (str && str.length > 0) {
        input =
          input.substring(0, cursorPosition) +
          str +
          input.substring(cursorPosition);
        cursorPosition += str.length;
      }
      state = { ...state, input, cursorPosition };
      state.onChange(input, cursorPosition);
      return;
    }
  }
});

type State =
  | {
      type: "ignore";
    }
  | {
      type: "await-keypress";
      permittedKeys: string[];
      onKeyPress: (keyName: string) => void;
    }
  | {
      type: "await-line";
      onChange: (input: string, cursorPosition: number) => void;
      onLineSubmitted: (line: string) => void;
      input: string;
      cursorPosition: number;
    };

let state: State = { type: "ignore" };

export const readKeypress = (permittedKeys: string[]): Promise<string> =>
  new Promise<string>(
    (resolve: (value: string) => void, reject: (reason: string) => void) => {
      state = {
        type: "await-keypress",
        permittedKeys,
        onKeyPress: (keyName: string) => {
          resolve(keyName);
        },
      };
    }
  );

export const readLine = (
  onChange: (input: string, cursorPosition: number) => void
): Promise<string> =>
  new Promise<string>(
    (resolve: (value: string) => void, reject: (reason: string) => void) => {
      state = {
        type: "await-line",
        input: "",
        cursorPosition: 0,
        onChange,
        onLineSubmitted: (line: string) => {
          resolve(line);
        },
      };
    }
  );
