import * as _ from "lodash";
import chalk from "chalk";

import * as renderUtils from "./renderUtils";
import {
  CardStage,
  SessionPage,
  TextWithCursor,
  TerminalViewModel,
} from "../types";
import config from "../config";

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

const renderProgressBar = (position: number, total: number) => {
  const suffix = ` (${position} / ${total})`;
  const barWidth = config.maxColumnWidth - suffix.length;
  const screenPosition = Math.round((barWidth * position) / total);

  return `${_.repeat("█", screenPosition)}${_.repeat(
    chalk.grey("░"),
    barWidth - screenPosition
  )}${suffix}`;
};

export const render = (sessionPage: SessionPage): TerminalViewModel => {
  const { upcomingCards, completedCards, stage } = sessionPage;

  if (upcomingCards.length === 0) {
    return { textWithCursor: { lines: ["No cards left"] }, animations: [] };
  }

  if (previousStageType !== stage.type) {
    console.clear();
    previousStageType = stage.type;
  }

  const lines: TextWithCursor[] = [];

  const addLine = (
    text: string = "",
    cursorPosition?: { x: number; y: number }
  ) => {
    lines.push({ lines: [text], cursorPosition });
  };

  const totalCards = upcomingCards.length + completedCards.length;
  const numberCompleted =
    completedCards.length +
    ((stage.type === "finished" || stage.type === "second-side-typed") &&
    stage.score > 1
      ? 1
      : 0);
  addLine("  " + renderProgressBar(numberCompleted, totalCards));

  const card = upcomingCards[0];

  addLine();
  addLine();

  if (card.new) {
    addLine(chalk.yellowBright("  ** NEW CARD **"));
  }
  switch (stage.type) {
    case "first-side-reveal":
      lines.push(
        createCard(
          card.sectionTitle,
          {
            lines: [
              `${
                card.direction === "front-to-back"
                  ? `${card.front} : ${blankText(card.back)}`
                  : `${blankText(card.front)} : ${card.back}`
              }`,
            ],
          },
          2
        )
      );
      addLine();
      addLine();
      addLine(
        chalk.greenBright(
          `  Hit SPACE to reveal ${
            card.direction === "front-to-back" ? "back" : "front"
          } of card`
        )
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
      const cardTextWithCursor = createCard(
        card.sectionTitle,
        {
          lines: [cardContent],
          cursorPosition: { x: cursorX, y: 0 },
        },
        2
      );
      lines.push(cardTextWithCursor);
      addLine();
      addLine();
      addLine(chalk.greenBright("  Type the missing answer and hit ENTER"));

      if (card.new) {
        addLine();
        addLine(
          chalk.greenBright(
            "  (If you don't know, just leave it blank and hit ENTER)"
          )
        );
      }
      break;
    }
    case "second-side-typed":
      lines.push(
        createCard(
          card.sectionTitle,
          {
            lines: [`${card.front} : ${card.back}`],
          },
          2
        )
      );
      addLine("");
      if (stage.score > 1) {
        addLine("  Well done!");
      } else if (stage.input.trim() !== "") {
        addLine("  Wrong");
      }
      addLine();
      addLine();
      addLine(chalk.greenBright("  Hit SPACE to continue"));
      break;
    case "second-side-revealed":
    case "finished":
      const score = stage.type === "finished" ? stage.score : undefined;
      const text =
        card.direction === "front-to-back"
          ? `${card.front} : ${card.back}`
          : `${card.front} : ${card.back}`;

      lines.push(createCard(card.sectionTitle, { lines: [text] }, 2));
      addLine();
      addLine();
      if (card.new) {
        addLine(
          chalk.greenBright(
            "  Did you already know this? Press the appropriate NUMBER KEY:"
          )
        );
        addLine();
        addLine(
          chalk.redBright(
            stage.type === "second-side-revealed" && stage.selectedScore === 1
              ? ">"
              : " "
          ) + chalk.redBright(!score || score === 1 ? " 1) No" : "")
        );
        addLine(
          chalk.yellowBright(
            stage.type === "second-side-revealed" && stage.selectedScore === 2
              ? ">"
              : " "
          ) + chalk.yellowBright(!score || score === 2 ? " 2) Yes, kinda" : "")
        );
        addLine(
          chalk.greenBright(
            stage.type === "second-side-revealed" && stage.selectedScore === 3
              ? ">"
              : " "
          ) + chalk.greenBright(!score || score === 3 ? " 3) Yes" : "")
        );
        addLine(
          chalk.greenBright(
            stage.type === "second-side-revealed" && stage.selectedScore === 4
              ? ">"
              : " "
          ) +
            chalk.greenBright(
              !score || score === 4 ? " 4) Yes, very well!" : ""
            )
        );
      } else {
        addLine(
          chalk.greenBright(
            "  Did you remember? Press the appropriate NUMBER KEY:"
          )
        );
        addLine();
        addLine(
          chalk.redBright(
            stage.type === "second-side-revealed" && stage.selectedScore === 1
              ? ">"
              : " "
          ) + chalk.redBright(!score || score === 1 ? " 1) No" : "")
        );
        addLine(
          chalk.yellowBright(
            stage.type === "second-side-revealed" && stage.selectedScore === 2
              ? ">"
              : " "
          ) +
            chalk.yellowBright(
              !score || score === 2 ? " 2) Yes, with difficulty" : ""
            )
        );
        addLine(
          chalk.greenBright(
            stage.type === "second-side-revealed" && stage.selectedScore === 3
              ? ">"
              : " "
          ) + chalk.greenBright(!score || score === 3 ? " 3) Yes" : "")
        );
        addLine(
          chalk.greenBright(
            stage.type === "second-side-revealed" && stage.selectedScore === 4
              ? ">"
              : " "
          ) + chalk.greenBright(!score || score === 4 ? " 4) Yes, easily!" : "")
        );
      }
      break;
  }

  return {
    textWithCursor: renderUtils.joinSections(lines),
    animations: [],
  };
};

export const createCard = (
  topic: string,
  body: TextWithCursor,
  leftMargin: number = 0
) => {
  const lines: TextWithCursor[] = [];

  lines.push({ lines: [`Topic: ${topic}`] });
  lines.push({ lines: [""] });
  lines.push(body);
  lines.push({ lines: [""] });

  return addFrame(
    renderUtils.joinSections(lines),
    config.maxColumnWidth,
    leftMargin
  );
};

export const addFrame = (
  textWithCursor: TextWithCursor,
  width: number,
  leftMargin: number = 0
): TextWithCursor => {
  let lines: TextWithCursor[] = [];

  lines.push({
    lines: [_.repeat(" ", leftMargin) + "┏" + _.repeat("━", width - 2) + "┓"],
  });

  let bodyLines = renderUtils.reflowText(textWithCursor, width - 4);

  for (let lineIndex = 0; lineIndex < bodyLines.lines.length; lineIndex++) {
    const line = bodyLines.lines[lineIndex];
    lines.push({
      lines: [
        _.repeat(" ", leftMargin) +
          "┃ " +
          line +
          _.repeat(" ", width - line.length - 4) +
          " ┃",
      ],
      cursorPosition:
        bodyLines.cursorPosition?.y === lineIndex
          ? {
              x: bodyLines.cursorPosition.x + 2 + leftMargin,
              y: 0,
            }
          : undefined,
    });
  }

  lines.push({
    lines: [_.repeat(" ", leftMargin) + "┗" + _.repeat("━", width - 2) + "┛"],
  });

  return renderUtils.joinSections(lines);
};
