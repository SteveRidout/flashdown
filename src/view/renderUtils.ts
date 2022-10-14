import _ from "lodash";
import { TextWithCursor } from "../types";

/**
 * Joins the given lines inserting a newline between each one. This will throw an error if more
 * than one line contains a cursor position.
 */
export const joinSections = (sections: TextWithCursor[]): TextWithCursor => {
  let y = 0;
  let cursorPosition: { x: number; y: number } | undefined = undefined;

  let allLines: string[] = [];

  for (const section of sections) {
    if (section.cursorPosition) {
      if (cursorPosition) {
        throw Error("Two separate lines both contain cursor positions");
      }

      cursorPosition = {
        x: section.cursorPosition.x,
        y: allLines.length + section.cursorPosition.y,
      };
    }

    allLines = [...allLines, ...section.lines];
    y += section.lines.length;
  }

  return {
    lines: allLines,
    cursorPosition,
  };
};

export const reflowText = (
  textWithCursor: TextWithCursor,
  columns: number
): TextWithCursor => {
  // XXX Is it worth creating this intermediate list or better just to create the final one from the
  // outset??
  const intermediateSections: TextWithCursor[] = [];

  for (
    let lineIndex = 0;
    lineIndex < textWithCursor.lines.length;
    lineIndex++
  ) {
    const line = textWithCursor.lines[lineIndex];
    /** These are the reflowed lines corresponding only to the current line */
    let reflowedLines: string[] = [line];
    let currentY = 0;
    let cursorPositionX: number | undefined =
      lineIndex === textWithCursor.cursorPosition?.y
        ? textWithCursor.cursorPosition?.x
        : undefined;
    let newLineCursorPosition: { x: number; y: number } | undefined;

    while (reflowedLines[reflowedLines.length - 1].length > columns) {
      if (reflowedLines[reflowedLines.length - 1][columns] === "_") {
        // Just split underlines wherever they are
        reflowedLines = [
          ...reflowedLines.slice(0, reflowedLines.length - 1),
          reflowedLines[reflowedLines.length - 1].substring(0, columns),
          reflowedLines[reflowedLines.length - 1].substring(columns),
        ];

        if (cursorPositionX !== undefined) {
          if (cursorPositionX < columns) {
            newLineCursorPosition = {
              y: currentY,
              x: cursorPositionX,
            };
            cursorPositionX = undefined;
          } else {
            cursorPositionX -= columns;
          }
        }

        currentY += 1;
      } else {
        let reflowX = columns;
        while (
          reflowedLines[reflowedLines.length - 1][reflowX] !== " " &&
          reflowX > 0
        ) {
          reflowX -= 1;
        }

        if (reflowX === 0) {
          reflowX = columns - 1;

          // Uh-oh, we couldn't reflow since there was no space character, so split the word with a
          // hyphen
          // XXX surely we can de-dup this and the above chunk of code
          reflowedLines = [
            ...reflowedLines.slice(0, reflowedLines.length - 1),
            reflowedLines[reflowedLines.length - 1].substring(0, reflowX) + "-",
            reflowedLines[reflowedLines.length - 1].substring(reflowX),
          ];

          if (cursorPositionX !== undefined) {
            if (cursorPositionX < reflowX) {
              newLineCursorPosition = {
                y: currentY,
                x: cursorPositionX,
              };
              cursorPositionX = undefined;
            } else {
              cursorPositionX -= reflowX;
            }
          }

          currentY += 1;
        } else {
          // Replace the space with a new line
          // XXX Again - could look at consolidating this with above 2 similar blocks of code
          reflowedLines = [
            ...reflowedLines.slice(0, reflowedLines.length - 1),
            reflowedLines[reflowedLines.length - 1].substring(0, reflowX),
            reflowedLines[reflowedLines.length - 1].substring(reflowX + 1),
          ];

          // XXX EDGE CASE not handled (I think!): what if the cursor is on the space character we
          // removed??
          if (cursorPositionX !== undefined) {
            if (cursorPositionX < reflowX) {
              newLineCursorPosition = {
                y: currentY,
                x: cursorPositionX,
              };
              cursorPositionX = undefined;
            } else {
              cursorPositionX -= reflowX + 1;
            }
          }

          currentY += 1;
        }
      }
    }

    // In case the cursor is on the last line (commonly this is the only line)
    if (cursorPositionX !== undefined) {
      newLineCursorPosition = {
        y: currentY,
        x: cursorPositionX,
      };
    }

    intermediateSections.push({
      lines: reflowedLines,
      cursorPosition: newLineCursorPosition,
    });
  }

  return joinSections(intermediateSections);
};

export const indent = (
  { lines, cursorPosition }: TextWithCursor,
  indentAmount: number
): TextWithCursor => {
  return {
    lines: lines.map((line) => _.repeat(" ", indentAmount) + line),
    cursorPosition: cursorPosition
      ? { x: cursorPosition.x + indentAmount, y: cursorPosition.y }
      : undefined,
  };
};
