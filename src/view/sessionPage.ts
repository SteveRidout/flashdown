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
import * as config from "../config";
import * as appState from "../appState";
import * as actions from "../actions";
import * as gradingUtils from "../gradingUtils";
import { getSpacedRepetitionInfo } from "../spacedRepetition";
import { getWidth } from "../terminalSize";

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

  const builder = new renderUtils.TextWithCursorBuilder();

  const totalCards = upcomingCards.length + completedCards.length;
  const numberCompleted =
    completedCards.length +
    ((stage.type === "finished" || stage.type === "second-side-typed") &&
    stage.score > 1
      ? 1
      : 0);
  const animations: Animation[] = [];
  let keyPressHandler: KeyPressHandler | undefined;

  builder.addText();
  if (numberCompleted > previousCompletedCards) {
    builder.addFormattedText(
      "  " +
        renderUtils.renderProgressBar(
          previousCompletedCards * 0.75 + numberCompleted * 0.25,
          totalCards,
          getWidth() - 2
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
          getWidth() - 2
        ),
        renderUtils.renderProgressBar(
          previousCompletedCards * 0.25 + numberCompleted * 0.75,
          totalCards,
          getWidth() - 2
        ),
        renderUtils.renderProgressBar(
          numberCompleted,
          totalCards,
          getWidth() - 2
        ),
      ],
      initialDelay: 20,
      frameDuration: 20,
    });
    previousCompletedCards = numberCompleted;
  } else {
    builder.addFormattedText(
      "  " +
        renderUtils.renderProgressBar(
          numberCompleted,
          totalCards,
          getWidth() - 2
        )
    );
  }

  const card = upcomingCards[0];

  builder.addText();
  builder.addText();

  if (card.new) {
    builder.addText("** NEW CARD **", "new-card");
  }

  switch (stage.type) {
    case "first-side-reveal": {
      const cardBodyText =
        card.direction === "front-to-back"
          ? `${card.front} : ${blankText(card.back)}`
          : `${blankText(card.front)} : ${card.back}`;
      builder.addSection(
        createCard(
          card.sectionTitle,
          {
            lines: [`${cardBodyText}`],
          },
          2
        )
      );
      builder.addText();
      builder.addText();
      builder.addText(
        `Hit SPACE to reveal ${
          card.direction === "front-to-back" ? "back" : "front"
        } of card`,
        "instruction"
      );
      if (previousSessionPage?.stage.type !== sessionPage.stage.type) {
        animations.push({
          type: "horizontal-pan",
          yRange: {
            start: 2,
            end: builder.sections.reduce(
              (memo, section) => memo + section.lines.length,
              0
            ),
          },
        });
      }

      keyPressHandler = (_str, key) => {
        if (!["space", "return"].includes(key.name)) {
          return false;
        }

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
        return true;
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
      builder.addSection(cardTextWithCursor);
      builder.addText();
      builder.addText();
      builder.addText("Type the missing answer and hit ENTER", "instruction");

      if (card.new) {
        builder.addText();
        builder.addText(
          "If you don't know, just leave it blank and hit ENTER)",
          "instruction"
        );
      }
      if (previousSessionPage?.stage.type !== sessionPage.stage.type) {
        animations.push({
          type: "horizontal-pan",
          yRange: {
            start: 2,
            end: builder.sections.reduce(
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
          return true;
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
        return true;
      };
      break;
    }

    case "second-side-typed":
      builder.addSection(
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
        builder.addText();
        builder.addText("Well done!", "feedback-good");
      } else if (stage.score === 2) {
        builder.addText();
        builder.addText("Close enough!", "feedback-medium");
      } else if (stage.input.trim() !== "") {
        builder.addText();
        builder.addText("Wrong", "feedback-bad");
      }
      builder.addText();
      builder.addText();
      builder.addText("Hit SPACE to continue", "instruction");

      keyPressHandler = (_str, key) => {
        if (!["space", "return"].includes(key.name)) {
          return false;
        }
        actions.progressToNextCard(stage.score);
        return true;
      };
      break;

    case "second-side-revealed":
    case "finished":
      const score = stage.type === "finished" ? stage.score : undefined;
      const text =
        card.direction === "front-to-back"
          ? `${card.front} : ${card.back}`
          : `${card.front} : ${card.back}`;

      builder.addSection(
        createCard(card.sectionTitle, { lines: [text] }, 2, card.note)
      );

      builder.addText(["", ""]);
      if (card.new) {
        builder.addText(
          "Did you already know this? Press the appropriate NUMBER KEY:",
          "instruction"
        );
        builder.addText();
        for (const lineScore of [1, 2, 3, 4]) {
          builder.addFormattedText(
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
        const didYouRemember = renderUtils.textSection(
          {
            lines: [
              "Did you already know this? Press the appropriate NUMBER KEY:",
            ],
          },
          "plain"
        );

        if (stage.type === "finished") {
          didYouRemember.lines = didYouRemember.lines.map((line) =>
            chalk.dim(line)
          );
        }
        builder.addSection(didYouRemember);
        builder.addText();
        for (const lineScore of [1, 2, 3, 4]) {
          builder.addText(
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
        if (config.get().stats) {
          builder.addText();
          builder.addText("Hit SPACE to continue", "instruction");
          keyPressHandler = (_str, key) => {
            if (!["space", "return"].includes(key.name)) {
              return false;
            }
            actions.progressToNextCard(stage.score);
            return true;
          };
        } else {
          // Not waiting for keypress in this case, instead just move to the next card after a short
          // delay
          setTimeout(() => {
            actions.progressToNextCard(score);
          }, 800);
        }
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
              return true;

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
              return true;

            case "1":
            case "2":
            case "3":
            case "4": {
              const score = parseInt(keyName, 10);
              actions.updateSessionPage({
                stage: { type: "finished", score },
              });
              return true;
            }

            case "space":
            case "return":
              actions.updateSessionPage({
                stage: {
                  type: "finished",
                  score: state.page.stage.selectedScore,
                },
              });
              return true;

            default:
              return false;
          }
        };
      }

      break;
  }

  previousSessionPage = sessionPage;

  // XXX Extract to separate component
  if (config.get().stats && !card.new && "previousInterval" in card) {
    builder.addText(["", ""]);
    const lastPracticeRecord = _.last(card.practiceRecords);
    if (lastPracticeRecord) {
      builder.addText(
        [
          "Previous practices: " + card.practiceRecords?.length,
          "Previous practice date: " +
            new Date(
              lastPracticeRecord.practiceTime * 60 * 1000
            ).toDateString(),
        ],
        "stats"
      );
    } else {
      builder.addText("Previous practices: " + 0, "stats");
    }
    builder.addText(
      [
        "Previous interval: " +
          (card.previousInterval === undefined
            ? "undefined"
            : (card.previousInterval / 60 / 24).toFixed(1) + " days"),
        "Previous score: " + card.previousScore,
        "Previous easiness: " + card.easinessFactor.toFixed(2),
      ],
      "stats"
    );

    if (stage.type === "finished" || stage.type === "second-side-typed") {
      const nextSRSInfo = getSpacedRepetitionInfo(card.practiceRecords);
      if (nextSRSInfo) {
        builder.addText(
          [
            "Next practice time: " +
              new Date(nextSRSInfo.nextPracticeTime * 60 * 1000).toDateString(),
            "Next easiness factor: " + nextSRSInfo.easinessFactor.toFixed(2),
          ],
          "stats"
        );
      } else {
        builder.addText("NO SRS INFO, bug?", "stats");
      }
    }
  }

  return {
    textWithCursor: builder.textWithCursor(),
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
  const cardContent: TextWithCursor[] = [
    { lines: [`Topic: ${topic}`, ""] },
    body,
    { lines: [""] },
  ];

  const cardWithoutNote = addFrame(
    renderUtils.joinSections(cardContent),
    getWidth(),
    leftMargin
  );

  if (!note) {
    return cardWithoutNote;
  }

  const renderedNote = addFrame(
    { lines: [`${note}`] },
    getWidth() - 2 - leftMargin
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
