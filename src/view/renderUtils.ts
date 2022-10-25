import _, { join } from "lodash";
import chalk from "chalk";

import { TextWithCursor, TextStyle } from "../types";
import { getWidth } from "../terminalSize";

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
        // Just split underlines wherever they are, regardless of whether there's a word break in
        // the text that's being hidden
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

export const shiftLeft = (
  { lines, cursorPosition }: TextWithCursor,
  amount: number
): TextWithCursor => {
  return {
    lines: lines.map((line) => line.substring(amount) + _.repeat(" ", amount)),
    cursorPosition: cursorPosition
      ? { x: cursorPosition.x - amount, y: cursorPosition.y }
      : undefined,
  };
};

export const shiftRight = (
  { lines, cursorPosition }: TextWithCursor,
  amount: number
): TextWithCursor => {
  return {
    lines: lines.map(
      (line) => _.repeat(" ", amount) + line.substring(0, getWidth() - amount)
    ),
    cursorPosition: cursorPosition
      ? { x: cursorPosition.x + amount, y: cursorPosition.y }
      : undefined,
  };
};

/**
 * Generates a new TextWithCursor in which @param overlayLines is overlayed on top of
 * @param textWithCursor at the given @param position.
 *
 * The cursor position from @param textWithCursor is maintained.
 */
export const overlay = (
  textWithCursor: TextWithCursor,
  overlayLines: string[],
  position: { x: number; y: number }
): TextWithCursor => {
  const totalLines = Math.max(
    textWithCursor.lines.length,
    position.y + overlayLines.length
  );

  return {
    ...textWithCursor,
    lines: _.range(totalLines).map((lineIndex) => {
      if (
        lineIndex < position.y ||
        lineIndex > position.y + overlayLines.length
      ) {
        return textWithCursor.lines[lineIndex];
      }

      return overlayLine(
        textWithCursor.lines[lineIndex] ?? "",
        overlayLines[lineIndex - position.y],
        position.x
      );
    }),
  };
};

const overlayLine = (
  background: string,
  overlay: string,
  x: number
): string => {
  return (
    _.padEnd(background.substring(0, x), x, " ") +
    // XXX Hackily hard coding color here
    chalk.yellow(overlay) +
    background.substring(x + overlay.length)
  );
};

export const renderProgressBar = (
  position: number,
  total: number,
  width: number,
  includeSuffix: boolean = true
) => {
  const suffix = includeSuffix ? ` (${Math.round(position)} / ${total})` : "";
  const barWidth = width - suffix.length;
  const screenPosition = Math.round((barWidth * position) / total);

  if (position === total) {
    return chalk.bgYellow(chalk.yellow(_.repeat("█", barWidth)));
  }

  return `${_.repeat(
    chalk.bgWhite(chalk.white("█")),
    screenPosition
  )}${_.repeat(chalk.grey("░"), barWidth - screenPosition)}${suffix}`;
};

export const reflowAndIndentLines = (
  textWithCursor: TextWithCursor
): TextWithCursor => {
  return indent(reflowText(textWithCursor, getWidth() - 2), 2);
};

export const textSection = (
  textWithCursor: TextWithCursor,
  style: TextStyle = "plain"
): TextWithCursor => {
  const stylingFunction: ((text: string) => string) | undefined = (() => {
    switch (style) {
      case "plain":
        return undefined;

      case "instruction":
        return chalk.cyanBright;

      case "new-card":
        return chalk.yellowBright;

      case "feedback-good":
        return (text: string) => chalk.bold(chalk.greenBright(text));

      case "feedback-medium":
        return (text: string) => chalk.bold(chalk.yellowBright(text));

      case "feedback-bad":
        return (text: string) => chalk.bold(chalk.redBright(text));

      default:
        throw Error("Style not recognized");
    }
  })();

  const reflowed = reflowAndIndentLines(textWithCursor);

  return {
    lines: reflowed.lines.map((line) => stylingFunction?.(line) ?? line),
    cursorPosition: reflowed.cursorPosition,
  };
};

export class TextWithCursorBuilder {
  sections: TextWithCursor[] = [];

  addText(
    text: string = "",
    textStyle: TextStyle = "plain",
    cursorPosition?: { x: number; y: number }
  ) {
    this.sections.push(
      textSection({ lines: [text], cursorPosition }, textStyle)
    );
  }

  textWithCursor(): TextWithCursor {
    return joinSections(this.sections);
  }

  // XXX How is this different to addText???
  addFormattedText(text: string) {
    this.sections.push(
      indent(
        {
          lines: [text],
        },
        2
      )
    );
  }

  addSection(section: TextWithCursor) {
    this.sections.push(section);
  }
}
