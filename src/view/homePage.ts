import * as _ from "lodash";
import chalk from "chalk";

import * as ansiEscapes from "../ansiEscapes";
import { HomePage, HomePageData } from "../types";

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
) => {
  const selectedTopicIndex = homePage.selectedTopicIndex;

  console.clear();
  console.log(
    "  Welcome to Flashdown by Steve Ridout (beta v0.1)   ",
    chalk.gray(fileName)
  );
  console.log("  ------------------------------------");

  if (homePageData.streak > 0) {
    const callToAction = homePageData.practicedToday
      ? ", return tomorrow to avoid losing it!"
      : "";

    console.log();
    console.log(
      `  You have a ${homePageData.streak} day streak${callToAction}`
    );
  }

  console.log();

  const columnWidths = [25, 15, 20];

  console.log(
    "  " + tableRow(["TOPIC", "TOTAL CARDS", "READY TO PRACTICE"], columnWidths)
  );
  console.log(
    "  " + tableRow(["-----", "-----------", "-----------------"], columnWidths)
  );
  let topicIndex = 0;
  for (const topic of homePageData.topics) {
    console.log(
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
      console.log();
    }
    topicIndex++;
  }

  console.log();
  console.log();
  console.log(
    chalk.greenBright(
      "  Use the UP and DOWN cursor keys to select the topic and hit ENTER to start"
    )
  );

  // Hide cursor
  process.stdin.write(ansiEscapes.hideCursor);
};
