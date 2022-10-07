import chalk from "chalk";
import * as readline from "readline";

import { Card, TextWithCursor } from "./types";
import * as ansiEscapes from "./ansiEscapes";
import * as renderUtils from "./renderUtils";
import config from "./config";

type CardStage =
  | { type: "first-side-reveal" }
  | { type: "first-side-type"; input: string; cursorPosition: number }
  | { type: "second-side-revealed" }
  | { type: "second-side-typed"; input: string; score: number }
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

let previousStageType: CardStage["type"];

const renderProgressBar = (position: number, total: number) =>
  `[${renderUtils.repeat("#", position)}${renderUtils.repeat(
    ".",
    total - position
  )}]`;

const render = () => {
  const { upcomingCards, completedCards, stage } = state;

  if (upcomingCards.length === 0) {
    return;
  }

  if (previousStageType !== stage.type) {
    console.clear();
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
  addLine(renderProgressBar(numberCompleted, totalCards));

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
      addLine();
      addLine();
      addLine(
        `Hit SPACE to reveal ${
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
      addLine();
      addLine();
      addLine(chalk.blue("Type the missing answer and hit ENTER"));

      if (card.new) {
        addLine();
        addLine(
          chalk.blue("(If you don't know, just leave it blank and hit ENTER)")
        );
      }
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
      } else if (stage.input.trim() !== "") {
        addLine("Wrong");
      }
      addLine();
      addLine();
      addLine(chalk.blue("Hit SPACE to continue"));
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
      addLine();
      if (card.new) {
        addLine(chalk.blue("Did you already know this?"));
        addLine();
        addLine(
          (!score || score === 1 ? "1) No" : "") +
            "\n" +
            (!score || score === 2 ? "2) Yes, kinda" : "") +
            "\n" +
            (!score || score === 3 ? "3) Yes" : "") +
            "\n" +
            (!score || score === 4 ? "4) Yes, very well!" : "")
        );
      } else {
        addLine(chalk.blue("Did you remember?"));
        addLine();
        addLine(
          (!score || score === 1 ? "1) No" : "") +
            "\n" +
            (!score || score === 2 ? "2) Yes, with difficulty" : "") +
            "\n" +
            (!score || score === 3 ? "3) Yes" : "") +
            "\n" +
            (!score || score === 4 ? "4) Yes, easily!" : "")
        );
      }
      break;
  }

  const { text, cursorPosition } = renderUtils.joinLines(lines);

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

  return addFrame(renderUtils.joinLines(lines), config.maxColumnWidth);
};

export const addFrame = (
  textWithCursor: TextWithCursor,
  width: number
): TextWithCursor => {
  let lines: TextWithCursor[] = [];

  lines.push({
    text: "┏" + renderUtils.repeat("━", width - 2) + "┓",
  });

  let bodyLines = renderUtils.splitIntoLines(
    renderUtils.reflowText(textWithCursor, width - 4)
  );

  for (const bodyLine of bodyLines) {
    lines.push({
      text:
        "┃ " +
        bodyLine.text +
        renderUtils.repeat(" ", width - bodyLine.text.length - 4) +
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
    text: "┗" + renderUtils.repeat("━", width - 2) + "┛",
  });

  return renderUtils.joinLines(lines);
};
