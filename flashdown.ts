// 1. Read and parse the fd and fdr files
// 2. Prepare session
// 3. Save backup file
// 4. Iterate through challenges and update the original text file based on the user's responses
// 5. Show summary at end

import * as _ from "lodash";
import * as chalk from "chalk";

import * as keyboard from "./src/keyboard";
import * as cardDAL from "./src/dal/cardDAL";
import * as practiceRecordDAL from "./src/dal/practiceRecordDAL";
import { HomePageData } from "./src/types";
import * as session from "./src/session";
import * as debug from "./src/debug";
import * as ansiEscapes from "./src/ansiEscapes";
import * as homePageUtils from "./src/homePageUtils";
import config from "./src/config";
import { repeat } from "lodash";
import * as utils from "./src/utils";
import * as sessionEnd from "./src/sessionEnd";
import * as renderUtils from "./src/renderUtils";

process.stdout.write(ansiEscapes.enableAlternativeBuffer);

debug.log("--------------");
debug.log("Start practice");
debug.log("--------------");

// XXX Read this from command line args instead
const baseName = "notes2";

type NextStep = "next-card" | "finished";

const processNextCard = async (): Promise<NextStep> => {
  const card = session.state.upcomingCards[0];

  if (!card) {
    throw Error("No more upcoming cards");
  }
  debug.log("Next card: " + JSON.stringify(card));

  const missingText =
    card.direction === "front-to-back" ? card.back : card.front;

  let score: number;

  if (/*!card.new &&*/ missingText.length <= config.typingThreshold) {
    session.setState({
      ...session.state,
      stage: { type: "first-side-type", input: "", cursorPosition: 0 },
    });

    const answer = await keyboard.readLine((input, cursorPosition) => {
      session.setState({
        ...session.state,
        stage: { type: "first-side-type", input, cursorPosition },
      });
    });

    score =
      answer.toLowerCase().trim() === missingText.toLowerCase().trim() ? 4 : 1;

    session.setState({
      ...session.state,
      stage: { type: "second-side-typed", input: answer, score },
    });

    await keyboard.readKeypress(["space", "return"]);
  } else {
    session.setState({
      ...session.state,
      stage: { type: "first-side-reveal" },
    });
    await keyboard.readKeypress(["space", "return"]);

    session.setState({
      ...session.state,
      stage: { type: "second-side-revealed" },
    });

    const key = await keyboard.readKeypress(["1", "2", "3", "4"]);
    score = parseInt(key, 10);

    session.setState({
      ...session.state,
      stage: { type: "finished", score },
    });

    await utils.sleep(800);
  }

  practiceRecordDAL.writeRecord(baseName, card, card.direction, score);

  if (score === 1) {
    // Put card back into session since the user didn't remember it
    session.setState({
      ...session.state,
      upcomingCards: [
        ...session.state.upcomingCards.slice(1),
        {
          ...card,
          new: false,
        },
      ],
    });
  } else {
    // Move card to completedCards list

    debug.log("moving card to completed: " + card.front);
    session.setState({
      ...session.state,
      upcomingCards: session.state.upcomingCards.slice(1),
      completedCards: [
        ...session.state.completedCards,
        {
          ...card,
          new: false,
        },
      ],
    });
    debug.log("moved card to completed: " + card.front);
  }

  debug.log(
    "process next card. upcoming: " + session.state.upcomingCards.length
  );

  if (session.state.upcomingCards[0]) {
    return "next-card";
  }
  return "finished";
};

// const pluralizeWord = (word: string, number: number) =>
//   `${word}${number === 1 ? "" : "s"}`;

const elideText = (text: string, maxLength: number): string => {
  if (text.length < maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + "...";
};

const addPadding = (text: string, length: number): string =>
  text + repeat(" ", length - text.length);

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

const renderHome = (homePageData: HomePageData, selectedTopicIndex: number) => {
  console.clear();
  console.log("  Welcome to Flashdown! (beta v0.1)");
  console.log("  ---------------------");
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

  const columnWidths = [20, 15, 20];

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
    "  Use the UP and DOWN cursor keys to select the topic and hit ENTER to start"
  );

  // Hide cursor
  process.stdin.write(ansiEscapes.hideCursor);
};

const showHome = async () => {
  // Get home page data
  const cards = cardDAL.getCards(baseName);
  const recordsMap = practiceRecordDAL.getRecords(baseName);
  const homePageData = homePageUtils.calcHomePageData(cards, recordsMap);

  debug.log("cards: " + JSON.stringify(cards));

  await homePageLoop(homePageData, homePageData.topics.length - 1);
};

const homePageLoop = async (homePageData: HomePageData, topicIndex: number) => {
  renderHome(homePageData, topicIndex);

  const keypress = await keyboard.readKeypress([
    "space",
    "return",
    "up",
    "down",
    "j",
    "k",
  ]);

  switch (keypress) {
    case "space":
    case "return":
      startSession(homePageData, topicIndex);
      break;

    case "up":
    case "k":
      homePageLoop(homePageData, Math.max(0, topicIndex - 1));
      break;

    case "down":
    case "j":
      homePageLoop(
        homePageData,
        Math.min(homePageData.topics.length - 1, topicIndex + 1)
      );
      break;
  }
};

const startSession = async (homePageData: HomePageData, topicIndex: number) => {
  const topic = homePageData.topics[topicIndex];

  let upcomingCards = topic.learningCardsDue
    .slice(0, config.targetCardsPerSession)
    .map((card) => ({ ...card.card, new: false }));

  if (upcomingCards.length < config.targetCardsPerSession) {
    upcomingCards = [
      ...upcomingCards,
      ...topic.newCards
        .slice(0, config.targetCardsPerSession - upcomingCards.length)
        .map((card) => ({
          ...card,
          new: true,
        })),
    ];
  }

  if (upcomingCards.length === 0) {
    await renderUtils.alert(
      "No cards ready to study in this topic. This is because the spaced repetition " +
        "algorithm has scheduled all the cards to be studied some time in the future."
    );
    homePageLoop(homePageData, topicIndex);
    return;
  }

  session.setState({
    upcomingCards,
    completedCards: [],
    stage: { type: "first-side-reveal" }, // XXX This will get overwritten
  });

  console.clear();

  let nextStep: NextStep = "next-card";
  while (nextStep === "next-card") {
    nextStep = await processNextCard();
  }

  // Show session end
  let newStreak = homePageData.streak;
  if (!homePageData.practiceHistory) {
    // The user *hadn't* practiced today before this session, now that they have completed the
    // session we can increase the streak by 1
    newStreak += 1;
  }

  await sessionEnd.run(homePageData.streak, newStreak);

  showHome();
};

showHome();
