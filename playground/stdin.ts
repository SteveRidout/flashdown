import readline from "readline";

// This is needed so that "keypress" events are emitted
readline.emitKeypressEvents(process.stdin);

console.log("stdin running keypress");

const template = (
  inputText: string
): { text: string; endOfInput: { x: number; y: number } } => {
  const linesBeforeCursor = ["", ""];
  const lineWithCursor = `Type here: ${inputText}`;
  const linesAfterCursor = ["", "That's it!"];

  return {
    text: [...linesBeforeCursor, lineWithCursor, ...linesAfterCursor].join(
      "\n"
    ),
    endOfInput: {
      x: lineWithCursor.length,
      y: linesBeforeCursor.length,
    },
  };
};

let caretIndex = 0;

const render = () => {
  console.clear();
  const { text, endOfInput: cursorPosition } = template(input);
  console.log(text);
  setCursorVisible(true);
  readline.cursorTo(
    process.stdin,
    cursorPosition.x - input.length + caretIndex,
    cursorPosition.y
  );
};

const setCursorVisible = (show: boolean) => {
  if (show) {
    console.log("\u001B[?25h"); // show cursor
  } else {
    console.log("\u001B[?25l"); // hides cursor
  }
};

process.stdin.setRawMode(true);

process.stdin.on("keypress", (str, key) => {
  // console.log("key: ", key);
  // return;
  if (key.name === "c" && key.ctrl) {
    process.exit();
  }

  if (key.name === "backspace") {
    if (input.length > 0) {
      input = input.substring(0, caretIndex - 1) + input.substring(caretIndex);
      caretIndex = Math.max(0, caretIndex - 1);
    }
  } else if (key.name === "left") {
    caretIndex = Math.max(0, caretIndex - 1);
  } else if (key.name === "right") {
    caretIndex = Math.min(input.length, caretIndex + 1);
  } else if (key.name === "enter" || key.name === "return") {
    console.log("DONE: ", input);
    return;
  } else if (str && str.length > 0) {
    input = input.substring(0, caretIndex) + str + input.substring(caretIndex);
    caretIndex += str.length;
  }

  render();
});

let input = "";

render();
