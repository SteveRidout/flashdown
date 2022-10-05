import * as readline from "readline";

import { Card, TextWithCursor } from "./types";
import * as ansiEscapes from "./ansiEscapes";

type CardStage =
  | { type: "first-side-reveal" }
  | { type: "first-side-type"; input: string; cursorPosition: number }
  | { type: "second-side-revealed" }
  | { type: "second-side-typed"; score: number }
  | { type: "finished"; score: number };

interface State {
  upcomingCards: (Card & { new: boolean })[];
  completedCards: (Card & { new: boolean })[];
  stage: CardStage;
}

/** Important: never set this directly, always set via the setState() function */
export let state: State;

const blankText = (input: string) =>
  input
    .split("")
    .map(() => "_")
    .join("");

const underlines = (length: number) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += "_";
  }
  return result;
};

const inputText = (input: string, target: string) => {
  // Adding a space at the end in case the user types one character more
  return `${input}${underlines(target.length - input.length)} `;
};

let previousStageType;

const renderProgressBar = (position: number, total: number) =>
  `[${repeat("#", position)}${repeat(".", total - position)}]`;

const render = () => {
  const { upcomingCards, completedCards, stage } = state;

  if (upcomingCards.length === 0) {
    console.log("WELL DONE! YOU FINISHED");
    // XXX Add session end experience
    process.stdout.clearScreenDown();
    return;
  }

  if (previousStageType !== stage.type) {
    // console.clear();
    previousStageType = stage.type;
  }
  process.stdout.cursorTo(0, 0);

  const lines: TextWithCursor[] = [];

  const addLine = (
    text: string = "",
    cursorPosition?: { x: number; y: number }
  ) => {
    lines.push({ text, cursorPosition });
  };

  const totalCards = upcomingCards.length + completedCards.length;
  const numberCompleted =
    completedCards.length +
    (stage.type === "finished" ||
    (stage.type === "second-side-typed" && stage.score > 1)
      ? 1
      : 0);
  addLine(`Progress: ${renderProgressBar(numberCompleted, totalCards)}`);

  const card = upcomingCards[0];

  addLine();

  if (card.new) {
    addLine("** NEW CARD **");
  }
  switch (stage.type) {
    case "first-side-reveal":
      lines.push(
        createCard(card.sectionTitle, {
          text: `${
            card.direction === "front-to-back"
              ? `${card.front} : ${blankText(card.back)}`
              : `${blankText(card.front)} : ${card.back}`
          }`,
        })
      );
      addLine("");
      addLine(
        `Hit space to reveal ${
          card.direction === "front-to-back" ? "back" : "front"
        } of card`
      );
      break;
    case "first-side-type": {
      let cardContent = "";
      let cursorX: number;
      if (card.direction === "front-to-back") {
        cardContent = `${card.front} : `;
        cursorX = cardContent.length + stage.cursorPosition;
        cardContent += `${inputText(stage.input, card.back)}`;
      } else {
        cardContent = `${inputText(stage.input, card.front)}: ${card.back}`;
        cursorX = stage.cursorPosition;
      }
      const cardTextWithCursor = createCard(card.sectionTitle, {
        text: cardContent,
        cursorPosition: { x: cursorX, y: 0 },
      });
      lines.push(cardTextWithCursor);
      addLine("");
      addLine("Type the missing answer and hit ENTER");
      break;
    }
    case "second-side-typed":
      lines.push(
        createCard(card.sectionTitle, {
          text: `${card.front} : ${card.back}`,
        })
      );
      addLine("");
      if (stage.score > 1) {
        addLine("Well done!");
      } else {
        addLine("Wrong");
      }
      addLine();
      addLine("Hit SPACE to continue");
      break;
    case "second-side-revealed":
    case "finished":
      const score = stage.type === "finished" ? stage.score : undefined;
      const text =
        card.direction === "front-to-back"
          ? `${card.front} : ${card.back}`
          : `${card.front} : ${card.back}`;

      lines.push(createCard(card.sectionTitle, { text }));
      addLine();
      if (card.new) {
        addLine(
          `Did you already know this?\n` +
            (!score || score === 1 ? "1) Not at all" : "") +
            "\n" +
            (!score || score === 2 ? "2) Kinda" : "") +
            "\n" +
            (!score || score === 3 ? "3) Yes" : "") +
            "\n" +
            (!score || score === 4 ? "4) Yes, very well!" : "")
        );
      } else {
        addLine(
          `How well did you remember?\n` +
            (!score || score === 1 ? "1) Not at all" : "") +
            "\n" +
            (!score || score === 2 ? "2) Kinda" : "") +
            "\n" +
            (!score || score === 3 ? "3) Good" : "") +
            "\n" +
            (!score || score === 4 ? "4) Easily!" : "")
        );
      }
      break;
  }

  const { text, cursorPosition } = joinLines(lines);

  console.log(text);

  process.stdout.clearScreenDown();

  if (cursorPosition) {
    readline.cursorTo(process.stdout, cursorPosition.x, cursorPosition.y);
    process.stdin.write(ansiEscapes.showCursor);
  } else {
    process.stdin.write(ansiEscapes.hideCursor);
  }
};

export const setState = (newState: State) => {
  state = newState;
  render();
};

export const createCard = (topic: string, body: TextWithCursor) => {
  const lines: TextWithCursor[] = [];

  lines.push({ text: `Topic: ${topic}` });
  lines.push({ text: "" });
  lines.push(body);
  lines.push({ text: "" });

  return addFrame(joinLines(lines), 60);
};

/**
 * Joins the given lines inserting a newline between each one. This will throw an error if more
 * than one line contains a cursor position.
 */
const joinLines = (lines: TextWithCursor[]): TextWithCursor => {
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
          console.log("WARNING: Couldn't reflow without adding hyphen");
          // Uh-oh, we couldn't reflow, should handle this, maybe by adding a hyphen character??
          // line.text[currentX + columns]
          const hyphenAndNewline = "-\n";
          text =
            text.substring(0, currentX + columns) +
            hyphenAndNewline +
            text.substring(currentX + columns);

          if (
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

          if (cursorPositionX >= currentX && cursorPositionX < reflowX) {
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
    if (cursorPositionX >= currentX && cursorPositionX < currentX + columns) {
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

const repeat = (character: string, size: number): string => {
  console.log("repeat: ", size);
  return size === 0 ? "" : [...Array(size)].map(() => character).join("");
};

export const addFrame = (
  textWithCursor: TextWithCursor,
  width: number
): TextWithCursor => {
  let lines: TextWithCursor[] = [];

  lines.push({
    text: "┏" + repeat("━", width - 2) + "┓",
  });

  let bodyLines = splitIntoLines(reflowText(textWithCursor, width - 4));

  for (const bodyLine of bodyLines) {
    lines.push({
      text:
        "┃ " +
        bodyLine.text +
        repeat(" ", width - bodyLine.text.length - 4) +
        " ┃",
      cursorPosition: bodyLine.cursorPosition
        ? {
            x: bodyLine.cursorPosition.x + 2,
            y: bodyLine.cursorPosition.y,
          }
        : undefined,
    });
  }

  lines.push({
    text: "┗" + repeat("━", width - 2) + "┛",
  });

  return joinLines(lines);
};
