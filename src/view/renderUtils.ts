import { TextWithCursor } from "../types";

/**
 * Joins the given lines inserting a newline between each one. This will throw an error if more
 * than one line contains a cursor position.
 */
export const joinLines = (lines: TextWithCursor[]): TextWithCursor => {
  let y = 0;
  let cursorPosition: { x: number; y: number } | undefined = undefined;

  for (const line of lines) {
    if (line.cursorPosition) {
      if (cursorPosition) {
        throw Error("Two separate lines both contain cursor positions");
      }

      cursorPosition = {
        x: line.cursorPosition.x,
        y: y + line.cursorPosition.y,
      };
    }
    y += line.text.split("\n").length;
  }

  return {
    text: lines.map(({ text }) => text).join("\n"),
    cursorPosition,
  };
};

export const splitIntoLines = (
  textWithCursor: TextWithCursor
): TextWithCursor[] => {
  let lines: TextWithCursor[] = textWithCursor.text
    .split("\n")
    .map((text) => ({ text }));

  if (textWithCursor.cursorPosition) {
    // Iterate through lines until we reach
    const line = lines[textWithCursor.cursorPosition.y];

    lines[textWithCursor.cursorPosition.y] = {
      text: line.text,
      cursorPosition: {
        x: textWithCursor.cursorPosition.x,
        y: 0,
      },
    };
  }

  return lines;
};

export const reflowText = (
  textWithCursor: TextWithCursor,
  columns: number
): TextWithCursor => {
  const lines = splitIntoLines(textWithCursor);

  const intermediateLines: TextWithCursor[] = [];

  for (const line of lines) {
    let currentY = 0;
    let currentX = 0;
    let text = line.text;
    let cursorPositionX: number | undefined = line.cursorPosition?.x;
    let newLineCursorPosition: { x: number; y: number } | undefined;

    while (text.length - currentX > columns) {
      let reflowX = currentX + columns;

      if (text[reflowX] === "_") {
        // Just split underlines
        const newLine = "\n";
        text =
          text.substring(0, currentX + columns) +
          newLine +
          text.substring(currentX + columns);

        if (
          cursorPositionX !== undefined &&
          cursorPositionX >= currentX &&
          cursorPositionX < currentX + columns
        ) {
          newLineCursorPosition = {
            y: currentY,
            x: cursorPositionX - currentX,
          };
          cursorPositionX = undefined;
        }

        currentX += columns + newLine.length;
        currentY += 1;
      } else {
        while (text[reflowX] !== " " && reflowX > currentX) {
          reflowX -= 1;
        }

        if (reflowX === currentX) {
          // Uh-oh, we couldn't reflow since there was no space character, so split the word with a
          // hyphen
          const hyphenAndNewline = "-\n";
          text =
            text.substring(0, currentX + columns) +
            hyphenAndNewline +
            text.substring(currentX + columns);

          if (
            cursorPositionX !== undefined &&
            cursorPositionX >= currentX &&
            cursorPositionX < currentX + columns
          ) {
            newLineCursorPosition = {
              y: currentY,
              x: cursorPositionX - currentX,
            };
            cursorPositionX = undefined;
          }

          if (cursorPositionX && cursorPositionX > currentX + columns) {
            cursorPositionX += hyphenAndNewline.length;
          }

          currentX += columns + hyphenAndNewline.length;
          currentY += 1;
        } else {
          // Replace the space with a newline
          text =
            text.substring(0, reflowX) + "\n" + text.substring(reflowX + 1);

          if (
            cursorPositionX !== undefined &&
            cursorPositionX >= currentX &&
            cursorPositionX < reflowX
          ) {
            newLineCursorPosition = {
              y: currentY,
              x: cursorPositionX - currentX,
            };
            cursorPositionX = undefined;
          }

          currentX = reflowX + 1;
          currentY += 1;
        }
      }
    }

    // In case the cursor is on the last line (commonly this is the only line)
    if (
      cursorPositionX !== undefined &&
      cursorPositionX >= currentX &&
      cursorPositionX < currentX + columns
    ) {
      newLineCursorPosition = {
        y: currentY,
        x: cursorPositionX - currentX,
      };
      cursorPositionX = undefined;
    }

    // XXX Add cursor position
    intermediateLines.push({ text, cursorPosition: newLineCursorPosition });
  }

  return joinLines(intermediateLines);
};

export const repeat = (character: string, size: number): string =>
  size === 0 ? "" : [...Array(size)].map(() => character).join("");
