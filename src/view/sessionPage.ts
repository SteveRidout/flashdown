import * as _ from "lodash";
import chalk from "chalk";

import * as renderUtils from "./renderUtils";
import {
  CardStage,
  SessionPage,
  TextWithCursor,
  TerminalViewModel,
  Animation,
  KeyPressHandler,
} from "../types";
import config from "../config";
import * as debug from "../debug";
import * as appState from "../appState";
import * as actions from "../actions";
import * as gradingUtils from "../gradingUtils";

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
  let keyPressHandler: KeyPressHandler | undefined;

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

      keyPressHandler = (_str, key) => {
        if (!["space", "return"].includes(key.name)) {
          return;
        }

        debug.log("session pressed: " + key.name);
        const state = appState.get();

        if (state.page.name !== "session") {
          throw Error("Unexpected state");
        }

        appState.setState({
          ...state,
          page: {
            ...state.page,
            stage: { type: "second-side-revealed", selectedScore: 2 },
          },
        });
      };

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

      keyPressHandler = (str, key) => {
        let { input, cursorPosition } = stage;

        const state = appState.get();

        if (state.page.name !== "session") {
          throw Error("Unexpected state");
        }

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
          const missingText =
            card.direction === "front-to-back" ? card.back : card.front;
          const match = gradingUtils.editDistance(
            gradingUtils.normalizeAnswer(input),
            gradingUtils.normalizeAnswer(missingText)
          );

          const score = match === "exact" ? 4 : match === "almost" ? 2 : 1;

          actions.updateSessionPage({
            ...state.page,
            stage: {
              type: "second-side-typed",
              input,
              score,
            },
          });
          return;
        } else if (str && str.length > 0) {
          input =
            input.substring(0, cursorPosition) +
            str +
            input.substring(cursorPosition);
          cursorPosition += str.length;
        }

        actions.updateSessionPage({
          ...state.page,
          stage: {
            type: "first-side-type",
            input,
            cursorPosition,
          },
        });
        return;
      };

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

      keyPressHandler = (_str, key) => {
        if (!["space", "return"].includes(key.name)) {
          return;
        }
        actions.processNextCard(stage.score);
      };
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

      if (stage.type === "finished") {
        setTimeout(() => {
          actions.processNextCard(score);
        }, 800);
      } else {
        keyPressHandler = (_str, key) => {
          const keyName = key.name;
          const state = appState.get();
          if (
            state.page.name !== "session" ||
            state.page.stage.type !== "second-side-revealed"
          ) {
            throw Error("Unexpected state");
          }

          switch (keyName) {
            case "up":
            case "k":
              // selectedScore = Math.max(1, selectedScore - 1);
              actions.updateSessionPage({
                stage: {
                  type: "second-side-revealed",
                  selectedScore: Math.max(
                    1,
                    state.page.stage.selectedScore - 1
                  ),
                },
              });

              break;

            case "down":
            case "j":
              actions.updateSessionPage({
                stage: {
                  type: "second-side-revealed",
                  selectedScore: Math.min(
                    4,
                    state.page.stage.selectedScore + 1
                  ),
                },
              });
              break;

            case "1":
            case "2":
            case "3":
            case "4": {
              const score = parseInt(keyName, 10);
              actions.updateSessionPage({
                stage: { type: "finished", score },
              });
              break;
            }

            case "space":
            case "return":
              actions.updateSessionPage({
                stage: {
                  type: "finished",
                  score: state.page.stage.selectedScore,
                },
              });
              break;

            default:
              return;
          }
        };
      }

      break;
  }

  previousSessionPage = sessionPage;

  return {
    textWithCursor: renderUtils.joinSections(lines),
    animations,
    keyPressHandler,
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
