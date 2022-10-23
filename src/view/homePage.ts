import * as _ from "lodash";
import chalk from "chalk";

import * as config from "../config";
import { HomePage, HomePageData, TerminalViewModel } from "../types";
import * as renderUtils from "./renderUtils";
import { version as appVersion } from "../../package.json";
import * as actions from "../actions";
import * as appState from "../appState";

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

  const lines: string[] = [];

  /**
   * Font comes from this repo which uses the MIT license
   * https://github.com/patorjk/figlet.js/blob/master/fonts/ANSI%20Regular.flf
   */
  const title = `
▇▇▇▇▇▇▇ ▇▇       ▇▇▇▇▇  ▇▇▇▇▇▇▇ ▇▇   ▇▇ ▇▇▇▇▇▇   ▇▇▇▇▇▇  ▇▇     ▇▇ ▇▇▇    ▇▇
▇▇      ▇▇      ▇▇   ▇▇ ▇▇      ▇▇   ▇▇ ▇▇   ▇▇ ▇▇    ▇▇ ▇▇     ▇▇ ▇▇▇▇   ▇▇
▇▇▇▇▇   ▇▇      ▇▇▇▇▇▇▇ ▇▇▇▇▇▇▇ ▇▇▇▇▇▇▇ ▇▇   ▇▇ ▇▇    ▇▇ ▇▇  ▇  ▇▇ ▇▇ ▇▇  ▇▇
▇▇      ▇▇      ▇▇   ▇▇      ▇▇ ▇▇   ▇▇ ▇▇   ▇▇ ▇▇    ▇▇ ▇▇ ▇▇▇ ▇▇ ▇▇  ▇▇ ▇▇
▇▇      ▇▇▇▇▇▇▇ ▇▇   ▇▇ ▇▇▇▇▇▇▇ ▇▇   ▇▇ ▇▇▇▇▇▇   ▇▇▇▇▇▇   ▇▇▇ ▇▇▇  ▇▇   ▇▇▇▇`;

  for (const line of title.split("\n")) {
    lines.push(
      chalk.yellow(elideText("  " + line, config.get().maxColumnWidth))
    );
  }
  lines.push(
    chalk.yellow(
      _.padStart(`v${appVersion} alpha`, config.get().maxColumnWidth)
    )
  );

  if (homePageData.streak > 0) {
    const callToAction = homePageData.practicedToday
      ? ", come back tomorrow to avoid losing it!"
      : `, practice now to make it ${homePageData.streak + 1}!`;

    lines.push("");

    // XXX This system of using lines.push() is getting ugly -- refactor!
    renderUtils
      .indent(
        renderUtils.reflowText(
          {
            lines: [
              `You're on a ${homePageData.streak} day streak${callToAction}`,
            ],
          },
          config.get().maxColumnWidth
        ),
        2
      )
      .lines.forEach((line) => {
        lines.push(line);
      });
  }

  lines.push("");

  const column2Width = (38 / 78) * config.get().maxColumnWidth;
  const columnWidths = [
    config.get().maxColumnWidth - column2Width - 2 - 2,
    column2Width,
  ];

  lines.push(
    chalk.bold("  " + tableRow(["TOPIC", "PRACTICE PROGRESS"], columnWidths))
  );
  lines.push("  " + tableRow(["-----", "-----------------"], columnWidths));

  for (let fileIndex = 0; fileIndex < homePageData.topics.length; fileIndex++) {
    const file = homePageData.topics[fileIndex];
    if (homePageData.topics.length > 2 && file.fileName) {
      lines.push(
        chalk.gray(
          tableRow(["  " + _.last(file.fileName.split("/")), ""], columnWidths)
        )
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
      lines.push(lineText);
      topicIndex++;
    }
    lines.push("");
  }

  lines.push("");
  lines.push(
    chalk.cyanBright(
      "  Use the UP and DOWN keys to select the topic and hit ENTER to start"
    )
  );

  return {
    textWithCursor: { lines },
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
