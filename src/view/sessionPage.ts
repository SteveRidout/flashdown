import * as _ from "lodash";
import chalk from "chalk";

import * as renderUtils from "./renderUtils";
import {
  CardStage,
  SessionPage,
  TextWithCursor,
  TerminalViewModel,
  Animation,
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

let previousCompletedCards = 0;

let previousSessionPage: SessionPage | undefined;

const multipleChoiceLine = (
  score: number,
  newCard: boolean,
  selectedScore?: number,
  finalScore?: number
) => {
  const description: string = (() => {
    switch (score) {
      case 1:
        return "No";
      case 2:
        return newCard ? "Yes, kinda" : "Yes, with difficulty";
      case 3:
        return "Yes";
      case 4:
        return newCard ? "Yes, easily!" : "Yes, very well";
      default:
        throw Error("Unexpected score");
    }
  })();

  let text = `  ${score}) ${description}`;
  if (score === finalScore || score === selectedScore) {
    text = ">" + text.substring(1);
  }

  let rendered: string = (() => {
    switch (score) {
      case 1:
        return chalk.redBright(text);
      case 2:
        return chalk.yellowBright(text);
      case 3:
        return chalk.greenBright(text);
      case 4:
        return chalk.greenBright(text);

      default:
        throw Error("Unexpected score");
    }
  })();

  if (score === finalScore || score === selectedScore) {
    rendered = chalk.bold(rendered);
  } else if (finalScore !== undefined) {
    rendered = chalk.dim(rendered);
  }

  return rendered;
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
  const animations: Animation[] = [];

  addLine();
  if (numberCompleted > previousCompletedCards) {
    addLine(
      "  " +
        renderUtils.renderProgressBar(
          previousCompletedCards * 0.75 + numberCompleted * 0.25,
          totalCards,
          config.maxColumnWidth - 2
        )
    );
    // Add animation
    animations.push({
      type: "frames",
      position: { y: 1, x: 2 },
      frames: [
        renderUtils.renderProgressBar(
          previousCompletedCards * 0.5 + numberCompleted * 0.5,
          totalCards,
          config.maxColumnWidth - 2
        ),
        renderUtils.renderProgressBar(
          previousCompletedCards * 0.25 + numberCompleted * 0.75,
          totalCards,
          config.maxColumnWidth - 2
        ),
        renderUtils.renderProgressBar(
          numberCompleted,
          totalCards,
          config.maxColumnWidth - 2
        ),
      ],
      initialDelay: 20,
      frameDuration: 20,
    });
    previousCompletedCards = numberCompleted;
  } else {
    addLine(
      "  " +
        renderUtils.renderProgressBar(
          numberCompleted,
          totalCards,
          config.maxColumnWidth - 2
        )
    );
  }

  const card = upcomingCards[0];

  addLine();
  addLine();

  if (card.new) {
    addLine(chalk.yellowBright("  ** NEW CARD **"));
  }

  switch (stage.type) {
    case "first-side-reveal": {
      const cardBodyText =
        card.direction === "front-to-back"
          ? `${card.front} : ${blankText(card.back)}`
          : `${blankText(card.front)} : ${card.back}`;
      lines.push(
        createCard(
          card.sectionTitle,
          {
            lines: [`${cardBodyText}`],
          },
          2
        )
      );
      addLine();
      addLine();
      addLine(
        chalk.cyanBright(
          `  Hit SPACE to reveal ${
            card.direction === "front-to-back" ? "back" : "front"
          } of card`
        )
      );
      if (previousSessionPage?.stage.type !== sessionPage.stage.type) {
        animations.push({
          type: "horizontal-pan",
          yRange: {
            start: 2,
            end: lines.reduce(
              (memo, section) => memo + section.lines.length,
              0
            ),
          },
        });
      }
      break;
    }

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
      addLine(chalk.cyanBright("  Type the missing answer and hit ENTER"));

      if (card.new) {
        addLine();
        addLine(
          chalk.cyanBright(
            "  (If you don't know, just leave it blank and hit ENTER)"
          )
        );
      }
      if (previousSessionPage?.stage.type !== sessionPage.stage.type) {
        animations.push({
          type: "horizontal-pan",
          yRange: {
            start: 2,
            end: lines.reduce(
              (memo, section) => memo + section.lines.length,
              0
            ),
          },
        });
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
          2,
          card.note
        )
      );

      if (stage.score > 2) {
        addLine("");
        addLine("  Well done!");
      } else if (stage.score === 2) {
        addLine("");
        addLine("  Close enough!");
      } else if (stage.input.trim() !== "") {
        addLine("");
        addLine("  Wrong");
      }
      addLine();
      addLine();
      addLine(chalk.cyanBright("  Hit SPACE to continue"));
      break;

    case "second-side-revealed":
    case "finished":
      const score = stage.type === "finished" ? stage.score : undefined;
      const text =
        card.direction === "front-to-back"
          ? `${card.front} : ${card.back}`
          : `${card.front} : ${card.back}`;

      lines.push(
        createCard(card.sectionTitle, { lines: [text] }, 2, card.note)
      );

      addLine();
      addLine();
      if (card.new) {
        addLine(
          chalk.cyanBright(
            "  Did you already know this? Press the appropriate NUMBER KEY:"
          )
        );
        addLine();
        for (const lineScore of [1, 2, 3, 4]) {
          addLine(
            multipleChoiceLine(
              lineScore,
              true,
              stage.type === "second-side-revealed"
                ? stage.selectedScore
                : undefined,
              score
            )
          );
        }
      } else {
        addLine(
          chalk.cyanBright(
            "  Did you remember? Press the appropriate NUMBER KEY:"
          )
        );
        addLine();
        for (const lineScore of [1, 2, 3, 4]) {
          addLine(
            multipleChoiceLine(
              lineScore,
              false,
              stage.type === "second-side-revealed"
                ? stage.selectedScore
                : undefined,
              score
            )
          );
        }
      }
      break;
  }

  previousSessionPage = sessionPage;

  return {
    textWithCursor: renderUtils.joinSections(lines),
    animations,
  };
};

export const createCard = (
  topic: string,
  body: TextWithCursor,
  leftMargin: number = 0,
  note?: string
) => {
  const lines: TextWithCursor[] = [];

  lines.push({ lines: [`Topic: ${topic}`] });
  lines.push({ lines: [""] });
  lines.push(body);
  lines.push({ lines: [""] });

  const cardWithoutNote = addFrame(
    renderUtils.joinSections(lines),
    config.maxColumnWidth,
    leftMargin
  );

  if (!note) {
    return cardWithoutNote;
  }

  const renderedNote = addFrame(
    { lines: [`${note}`] },
    config.maxColumnWidth - 2 - leftMargin
  );

  return renderUtils.overlay(cardWithoutNote, renderedNote.lines, {
    y: cardWithoutNote.lines.length - 2,
    x: leftMargin + 2,
  });
};

export const addFrame = (
  textWithCursor: TextWithCursor,
  width: number,
  leftMargin: number = 0
): TextWithCursor => {
  let sections: TextWithCursor[] = [];

  sections.push({
    lines: [
      _.repeat(" ", leftMargin) +
        "┏" +
        _.repeat("━", width - 2 - leftMargin) +
        "┓",
    ],
  });

  let bodyLines = renderUtils.reflowText(
    textWithCursor,
    width - 4 - leftMargin
  );

  for (let lineIndex = 0; lineIndex < bodyLines.lines.length; lineIndex++) {
    const line = bodyLines.lines[lineIndex];
    sections.push({
      lines: [
        _.repeat(" ", leftMargin) +
          "┃ " +
          line +
          _.repeat(" ", width - line.length - 4 - leftMargin) +
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

  sections.push({
    lines: [
      _.repeat(" ", leftMargin) +
        "┗" +
        _.repeat("━", width - 2 - leftMargin) +
        "┛",
    ],
  });

  // return applyCardColor(renderUtils.joinSections(sections));
  return renderUtils.joinSections(sections);
};
