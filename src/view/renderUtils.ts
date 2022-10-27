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

/**
 * Wrap text to fit within maximum number of columns
 *
 * @param textWithCursor The input text to be wrapped
 * @param maxColumns The maximum number of columns permitted in the output text
 * @returns The input text but with each line wrapped to fit within the given number of columns
 */
export const wrapText = (
  textWithCursor: TextWithCursor,
  maxColumns: number
): TextWithCursor => {
  // XXX Is it worth creating this intermediate list or would it be neater start building the final
  // TextWithCursor object from the outset??
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

    while (reflowedLines[reflowedLines.length - 1].length > maxColumns) {
      if (reflowedLines[reflowedLines.length - 1][maxColumns] === "_") {
        // Just split underlines wherever they are, regardless of whether there's a word break in
        // the text that's being hidden
        reflowedLines = [
          ...reflowedLines.slice(0, reflowedLines.length - 1),
          reflowedLines[reflowedLines.length - 1].substring(0, maxColumns),
          reflowedLines[reflowedLines.length - 1].substring(maxColumns),
        ];

        if (cursorPositionX !== undefined) {
          if (cursorPositionX < maxColumns) {
            newLineCursorPosition = {
              y: currentY,
              x: cursorPositionX,
            };
            cursorPositionX = undefined;
          } else {
            cursorPositionX -= maxColumns;
          }
        }

        currentY += 1;
      } else {
        let reflowX = maxColumns;
        while (
          reflowedLines[reflowedLines.length - 1][reflowX] !== " " &&
          reflowX > 0
        ) {
          reflowX -= 1;
        }

        if (reflowX === 0) {
          reflowX = maxColumns - 1;

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
 * Overlay one block of text over the top of another block of text at a given position
 *
 * @param backgroundLines The text to appear underneath
 * @param overlayLines The text to appear on top
 * @param position The coordinates at which to start drawing the overlay over the background
 * @returns combined text in which overlayLines is overlayed on top of backgroundLines
 */
export const overlay = (
  backgroundLines: TextWithCursor,
  overlayLines: string[],
  position: { x: number; y: number }
): TextWithCursor => {
  const totalLines = Math.max(
    backgroundLines.lines.length,
    position.y + overlayLines.length
  );

  return {
    ...backgroundLines,
    lines: _.range(totalLines).map((lineIndex) => {
      if (
        lineIndex < position.y ||
        lineIndex > position.y + overlayLines.length
      ) {
        return backgroundLines.lines[lineIndex];
      }

      return overlayLine(
        backgroundLines.lines[lineIndex] ?? "",
        overlayLines[lineIndex - position.y],
        position.x,
        chalk.yellow
      );
    }),
  };
};

/**
 * Overlays a single line of text on top of another single line of text
 *
 * @param background The text "underneath", which will be partially obscured
 * @param overlay The text which will appear "on top"
 * @param x The character index within background where the overlay will start
 * @returns The combined line of text
 */
const overlayLine = (
  background: string,
  overlay: string,
  x: number,
  styleFunction?: (plainText: string) => string
): string => {
  return (
    _.padEnd(background.substring(0, x), x, " ") +
    (styleFunction?.(overlay) ?? overlay) +
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
  return indent(wrapText(textWithCursor, getWidth() - 2), 2);
};

export const textSection = (
  textWithCursor: TextWithCursor,
  style: TextStyle = "plain"
): TextWithCursor => {
  let stylingFunction: ((text: string) => string) | undefined;
  switch (style) {
    case "plain":
      // No style
      break;

    case "instruction":
      stylingFunction = chalk.cyanBright;
      break;

    case "new-card":
      stylingFunction = chalk.yellowBright;
      break;

    case "feedback-good":
      stylingFunction = (text: string) => chalk.bold(chalk.greenBright(text));
      break;

    case "feedback-medium":
      stylingFunction = (text: string) => chalk.bold(chalk.yellowBright(text));
      break;

    case "feedback-bad":
      stylingFunction = (text: string) => chalk.bold(chalk.redBright(text));
      break;

    case "stats":
    case "subtle":
      stylingFunction = chalk.gray;
      break;

    case "title":
      stylingFunction = chalk.yellow;
      break;

    case "table-header":
      stylingFunction = chalk.bold;
      break;

    case "table-filename":
      stylingFunction = chalk.gray;
      break;

    default:
      throw Error("Style not recognized");
  }

  const reflowed = reflowAndIndentLines(textWithCursor);

  return {
    lines: reflowed.lines.map((line) => stylingFunction?.(line) ?? line),
    cursorPosition: reflowed.cursorPosition,
  };
};

export class TextWithCursorBuilder {
  sections: TextWithCursor[] = [];

  /**
   * Adds either a single line of text or a list of lines, which will be wrapped if appropriate to
   * fit within the maximum column limit and a left margin indent is added. The provided
   * @param plainText is not permitted to contain ANSI escape codes, formatting will be applied by
   * this function based on the provided @param textStyle.
   */
  addText(
    plainText: string | string[] = "",
    textStyle: TextStyle = "plain",
    cursorPosition?: { x: number; y: number }
  ) {
    this.sections.push(
      textSection(
        {
          lines: _.isString(plainText) ? [plainText] : plainText,
          cursorPosition,
        },
        textStyle
      )
    );
  }

  textWithCursor(): TextWithCursor {
    return joinSections(this.sections);
  }

  /**
   * This is different from addText in that @param formattedText is permitted to contain ANSI escape
   * codes and it won't be reflowed, so the caller needs to make sure that @param formattedText
   * doesn't exceed the maximum column limit.
   */
  addFormattedText(formattedText: string) {
    this.sections.push({
      lines: [formattedText],
    });
  }

  addSection(section: TextWithCursor) {
    this.sections.push(section);
  }
}
