import * as _ from "lodash";
import chalk from "chalk";

import config from "../config";
import { HomePage, HomePageData, TerminalViewModel } from "../types";

const elideText = (text: string, maxLength: number): string => {
  if (text.length < maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + "...";
};

const addPadding = (text: string, length: number): string =>
  text + _.repeat(" ", length - text.length);

const tableRow = (items: (string | number)[], maxLengths: number[]): string => {
  const renderedItems: string[] = [];

  if (items.length !== maxLengths.length) {
    throw Error("Array of lengths doesn't match the array of items");
  }

  for (let i = 0; i < items.length; i++) {
    const rendered = elideText(items[i].toString(), maxLengths[i]);

    renderedItems[i] =
      i === 0
        ? _.padEnd(rendered, maxLengths[i], " ")
        : _.padStart(rendered, maxLengths[i], " ");
  }

  return renderedItems.join("  ");
};

export const render = (
  homePageData: HomePageData,
  fileName: string,
  homePage: HomePage
): TerminalViewModel => {
  const selectedTopicIndex = homePage.selectedTopicIndex;

  const lines: string[] = [];

  /**
   * Font comes from this repo which uses the MIT license
   * https://github.com/patorjk/figlet.js/blob/master/fonts/ANSI%20Regular.flf
   */
  const titleLines: string[] = `
███████ ██       █████  ███████ ██   ██ ██████   ██████  ██     ██ ███    ██
██      ██      ██   ██ ██      ██   ██ ██   ██ ██    ██ ██     ██ ████   ██
█████   ██      ███████ ███████ ███████ ██   ██ ██    ██ ██  █  ██ ██ ██  ██
██      ██      ██   ██      ██ ██   ██ ██   ██ ██    ██ ██ ███ ██ ██  ██ ██
██      ███████ ██   ██ ███████ ██   ██ ██████   ██████   ███ ███  ██   ████
`.split("\n");

  for (const line of titleLines) {
    lines.push(chalk.yellow("  " + line));
  }

  if (homePageData.streak > 0) {
    const callToAction = homePageData.practicedToday
      ? ", return tomorrow to avoid losing it!"
      : "";

    lines.push("");
    lines.push(`  You have a ${homePageData.streak} day streak${callToAction}`);
  }

  lines.push("");

  const columnWidths = [
    Math.min(config.maxColumnWidth - 35 - 2 - 4, titleLines[1].length - 35 - 4),
    15,
    20,
  ];

  lines.push(
    "  " + tableRow(["TOPIC", "TOTAL CARDS", "READY TO PRACTICE"], columnWidths)
  );
  lines.push(
    "  " + tableRow(["-----", "-----------", "-----------------"], columnWidths)
  );
  let topicIndex = 0;
  for (const topic of homePageData.topics) {
    lines.push(
      `${topicIndex === selectedTopicIndex ? ">" : " "} ${tableRow(
        [
          topic.name,
          topic.newCards.length +
            topic.learningCardsDue.length +
            topic.learningCardsNotDue.length,
          topic.newCards.length + topic.learningCardsDue.length,
        ],
        columnWidths
      )}`
    );
    if (
      homePageData.topics.length > 1 &&
      topicIndex === homePageData.topics.length - 2
    ) {
      lines.push("");
    }
    topicIndex++;
  }

  lines.push("");
  lines.push("");
  lines.push(
    chalk.cyanBright(
      "  Use the UP and DOWN cursor keys to select the topic and hit ENTER to start"
    )
  );

  return {
    textWithCursor: { lines },
    animations: [],
  };
};
