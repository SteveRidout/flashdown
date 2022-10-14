import * as _ from "lodash";
import chalk from "chalk";

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
    renderedItems[i] = addPadding(
      elideText(items[i].toString(), maxLengths[i]),
      maxLengths[i]
    );
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

  lines.push(
    "  Welcome to Flashdown by Steve Ridout (beta v0.1)   " +
      chalk.gray(fileName)
  );
  lines.push("  ------------------------------------");

  if (homePageData.streak > 0) {
    const callToAction = homePageData.practicedToday
      ? ", return tomorrow to avoid losing it!"
      : "";

    lines.push("");
    lines.push(`  You have a ${homePageData.streak} day streak${callToAction}`);
  }

  lines.push("");

  const columnWidths = [25, 15, 20];

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
    chalk.greenBright(
      "  Use the UP and DOWN cursor keys to select the topic and hit ENTER to start"
    )
  );

  return {
    textWithCursor: { lines },
    animations: [],
  };
};
