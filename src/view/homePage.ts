import * as _ from "lodash";
import chalk from "chalk";

import { HomePage, HomePageData, TerminalViewModel } from "../types";
import * as renderUtils from "./renderUtils";
import { version as appVersion } from "../../package.json";
import * as actions from "../actions";
import * as appState from "../appState";
import { getWidth } from "../terminalSize";

const elideText = (text: string, maxLength: number): string => {
  if (text.length < maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + "...";
};

const tableRow = (items: (string | number)[], maxLengths: number[]): string => {
  const renderedItems: string[] = [];

  if (items.length !== maxLengths.length) {
    throw Error("Array of lengths doesn't match the array of items");
  }

  for (let i = 0; i < items.length; i++) {
    const rendered = elideText(items[i].toString(), maxLengths[i]);

    renderedItems[i] = _.padEnd(rendered, maxLengths[i], " ");
  }

  return renderedItems.join("  ");
};

const tableDataRow = (
  topic: string,
  ready: number,
  total: number,
  columnWidths: number[]
) => {
  const [topicWidth, barWidth] = columnWidths;

  const text = ` ${_.padStart((total - ready).toString(), 3)} / ${_.padStart(
    total.toString(),
    3
  )}`;
  const restOfWidth = barWidth - text.length;

  let result = `${_.padEnd(
    elideText(topic, topicWidth),
    topicWidth,
    " "
  )}  ${renderUtils.renderProgressBar(
    total - ready,
    total,
    restOfWidth,
    false
  )}${text}`;

  if (ready === 0) {
    result = chalk.yellowBright(result);
  }

  return result;
};

export const render = (
  homePageData: HomePageData,
  homePage: HomePage
): TerminalViewModel => {
  const selectedTopicIndex = homePage.selectedTopicIndex;

  const builder = new renderUtils.TextWithCursorBuilder();

  /**
   * Font comes from this repo which uses the MIT license
   * https://github.com/patorjk/figlet.js/blob/master/fonts/ANSI%20Regular.flf
   */
  let title = `
▇▇▇▇▇▇▇ ▇▇       ▇▇▇▇▇  ▇▇▇▇▇▇▇ ▇▇   ▇▇ ▇▇▇▇▇▇   ▇▇▇▇▇▇  ▇▇     ▇▇ ▇▇▇    ▇▇
▇▇      ▇▇      ▇▇   ▇▇ ▇▇      ▇▇   ▇▇ ▇▇   ▇▇ ▇▇    ▇▇ ▇▇     ▇▇ ▇▇▇▇   ▇▇
▇▇▇▇▇   ▇▇      ▇▇▇▇▇▇▇ ▇▇▇▇▇▇▇ ▇▇▇▇▇▇▇ ▇▇   ▇▇ ▇▇    ▇▇ ▇▇  ▇  ▇▇ ▇▇ ▇▇  ▇▇
▇▇      ▇▇      ▇▇   ▇▇      ▇▇ ▇▇   ▇▇ ▇▇   ▇▇ ▇▇    ▇▇ ▇▇ ▇▇▇ ▇▇ ▇▇  ▇▇ ▇▇
▇▇      ▇▇▇▇▇▇▇ ▇▇   ▇▇ ▇▇▇▇▇▇▇ ▇▇   ▇▇ ▇▇▇▇▇▇   ▇▇▇▇▇▇   ▇▇▇ ▇▇▇  ▇▇   ▇▇▇▇`.split(
    "\n"
  );

  const versionString = `v${appVersion} alpha`;

  if (title[1].length > getWidth()) {
    // Go for simple smaller title instead
    builder.addText();
    const flashdownString = "FLASHDOWN";
    builder.addSection({
      lines: [
        chalk.yellow(
          "  " +
            chalk.bold(flashdownString) +
            _.repeat(
              " ",
              getWidth() - flashdownString.length - versionString.length - 2
            ) +
            versionString
        ),
      ],
    });
  } else {
    for (const line of title) {
      // lines.push(chalk.yellow("  " + line));
      builder.addText(line, "title");
    }
    builder.addSection({
      lines: [chalk.yellow(_.padStart(versionString, getWidth()))],
    });
  }

  if (homePageData.streak > 0) {
    const callToAction = homePageData.practicedToday
      ? ", come back tomorrow to avoid losing it!"
      : `, practice now to make it ${homePageData.streak + 1}!`;

    builder.addText();
    builder.addText(
      `You're on a ${homePageData.streak} day streak${callToAction}`
    );
  }

  builder.addText();

  const column2Width = (38 / 78) * getWidth();
  const columnWidths = [getWidth() - column2Width - 2 - 2, column2Width];

  builder.addText(
    tableRow(["TOPIC", "PRACTICE PROGRESS"], columnWidths),
    "table-header"
  );
  builder.addText(tableRow(["-----", "-----------------"], columnWidths));

  for (let fileIndex = 0; fileIndex < homePageData.topics.length; fileIndex++) {
    const file = homePageData.topics[fileIndex];
    if (homePageData.topics.length > 2 && file.fileName) {
      builder.addText(
        tableRow([_.last(file.fileName.split("/")) ?? "", ""], columnWidths),
        "table-filename"
      );
    }

    let topicIndex = 0;
    for (const topic of file.data) {
      let lineText = `${
        fileIndex === homePage.selectedFileNameIndex &&
        topicIndex === selectedTopicIndex
          ? ">"
          : " "
      } ${tableDataRow(
        topic.name,
        topic.newCards.length + topic.learningCardsDue.length,
        topic.newCards.length +
          topic.learningCardsDue.length +
          topic.learningCardsNotDue.length,
        columnWidths
      )}`;
      if (
        topicIndex === selectedTopicIndex &&
        fileIndex === homePage.selectedFileNameIndex
      ) {
        lineText = chalk.bold(lineText);
      }
      builder.addSection({ lines: [lineText] });
      topicIndex++;
    }
    builder.addText();
  }

  builder.addText();
  builder.addText(
    "Use the UP and DOWN keys to select the topic and hit ENTER to start",
    "instruction"
  );

  return {
    textWithCursor: builder.textWithCursor(),
    animations: [],
    keyPressHandler: (_str, key) => {
      const state = appState.get();
      if (state.page.name !== "home") {
        throw Error("Unexpected page");
      }

      const fileNameIndex = state.page.selectedFileNameIndex;
      const topicIndex = state.page.selectedTopicIndex;

      switch (key.name) {
        case "space":
        case "return":
          actions.startSession(homePageData, fileNameIndex, topicIndex);
          return true;

        case "up":
        case "k":
          if (topicIndex === 0 && fileNameIndex > 0) {
            actions.updateHomePage(
              fileNameIndex - 1,
              homePageData.topics[fileNameIndex - 1].data.length - 1
            );
          } else if (topicIndex > 0) {
            actions.updateHomePage(fileNameIndex, topicIndex - 1);
          } else {
            actions.updateHomePage(fileNameIndex, topicIndex);
          }
          return true;

        case "down":
        case "j":
          if (
            topicIndex === homePageData.topics[fileNameIndex].data.length - 1 &&
            fileNameIndex < homePageData.topics.length - 1
          ) {
            actions.updateHomePage(fileNameIndex + 1, 0);
          } else if (
            topicIndex <
            homePageData.topics[fileNameIndex].data.length - 1
          ) {
            actions.updateHomePage(fileNameIndex, topicIndex + 1);
          } else {
            actions.updateHomePage(fileNameIndex, topicIndex);
          }
          return true;

        default:
          return false;
      }
    },
  };
};
