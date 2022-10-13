// 1. Read and parse the fd and fdr files
// 2. Prepare session
// 3. Save backup file
// 4. Iterate through challenges and update the original text file based on the user's responses
// 5. Show summary at end

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as _ from "lodash";
import chalk from "chalk";
import { program } from "commander";

import * as keyboard from "./keyboard";
import * as cardDAL from "./dal/cardDAL";
import * as practiceRecordDAL from "./dal/practiceRecordDAL";
import { CardWithLearningMetrics, HomePageData } from "./types";
import * as session from "./session";
import * as debug from "./debug";
import * as ansiEscapes from "./ansiEscapes";
import * as homePageUtils from "./homePageUtils";
import config from "./config";
import { repeat } from "lodash";
import * as utils from "./utils";
import * as sessionEnd from "./sessionEnd";
import * as alertModal from "./alertModal";

program.option("--file <filename>");
program.parse(process.argv);
const options: {
  file?: string;
} = program.opts();

process.stdout.write(ansiEscapes.enableAlternativeBuffer);

debug.log("--------------");
debug.log("Start practice");
debug.log("--------------");

debug.log("options: " + JSON.stringify(program.opts()));

// XXX Read this from command line args instead
let fileName = options.file ?? "notes.fd";

if (!fs.existsSync(fileName) && !fileName.endsWith(".fd")) {
  // Try adding .fd to see if that works
  fileName += ".fd";
}

if (!fs.existsSync(fileName)) {
  // Look for file in standard location:
  // ~/.flashdown/notes.fd
  fileName = path.resolve(os.homedir(), ".flashdown/notes.fd");
}

if (!fs.existsSync(fileName)) {
  console.error(`Error: The file "${fileName}" doesn't exist`);
  console.error();
  console.error(
    "Tip: Run Flashdown from within a directory containing a notes.fd file or use the " +
      "--file <filename> option to specify the location of your .fd file."
  );
  console.error();
  process.exit();
}

type NextStep = "next-card" | "finished";

const normalizedCharacterMap: { [nonNormalizedCharacter: string]: string } = {
  ï: "i",
  "-": " ",
};

const normalizeAnswer = (answer: string) =>
  answer
    .split("")
    .map((character) => normalizedCharacterMap[character] ?? character)
    .join("")
    .trim()
    .toLowerCase();

const processNextCard = async (): Promise<NextStep> => {
  const card = session.state.upcomingCards[0];

  if (!card) {
    throw Error("No more upcoming cards");
  }
  debug.log("Next card: " + JSON.stringify(card));
  if ("previousInterval" in card && card.previousInterval) {
    debug.log(
      "Previous interval (days): " + card.previousInterval / (24 * 60) + " days"
    );
    debug.log("Scheduled time: " + new Date(card.nextPracticeTime * 60 * 1000));
  }

  const missingText =
    card.direction === "front-to-back" ? card.back : card.front;

  let score: number;

  if (missingText.length <= config.typingThreshold) {
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

    score = normalizeAnswer(answer) === normalizeAnswer(missingText) ? 4 : 1;

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

    let selectedScore = 2;
    session.setState({
      ...session.state,
      stage: { type: "second-side-revealed", selectedScore },
    });

    let finalScore: number | undefined;

    while (finalScore === undefined) {
      const key = await keyboard.readKeypress([
        "1",
        "2",
        "3",
        "4",
        "up",
        "down",
        "j",
        "k",
        "space",
        "return",
      ]);
      switch (key) {
        case "up":
        case "k":
          selectedScore = Math.max(1, selectedScore - 1);
          session.setState({
            ...session.state,
            stage: {
              type: "second-side-revealed",
              selectedScore,
            },
          });
          break;

        case "down":
        case "j":
          selectedScore = Math.min(4, selectedScore + 1);
          session.setState({
            ...session.state,
            stage: {
              type: "second-side-revealed",
              selectedScore,
            },
          });
          break;

        case "1":
        case "2":
        case "3":
        case "4":
          finalScore = parseInt(key, 10);
          break;

        case "space":
        case "return":
          finalScore = selectedScore;
          break;

        default:
          throw Error("Unexpected key stroke");
      }
    }

    score = finalScore;

    session.setState({
      ...session.state,
      stage: { type: "finished", score },
    });

    await utils.sleep(800);
  }

  practiceRecordDAL.writeRecord(fileName, card, card.direction, score);

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
  }

  if (session.state.upcomingCards[0]) {
    return "next-card";
  }
  return "finished";
};

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

const showHome = async () => {
  // Get home page data
  const cards = cardDAL.getCards(fileName);
  const recordsMap = practiceRecordDAL.getRecords(fileName);
  const homePageData = homePageUtils.calcHomePageData(cards, recordsMap);

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

  let upcomingCards: CardWithLearningMetrics[] = topic.learningCardsDue
    .slice(0, config.targetCardsPerSession)
    .map((card) => ({
      ...card.card,
      new: false,
      ...card.learningMetrics,
    }));

  if (upcomingCards.length < config.targetCardsPerSession) {
    upcomingCards = [
      ...upcomingCards,
      ...topic.newCards
        .slice(0, config.targetCardsPerSession - upcomingCards.length)
        .map((card) => ({
          ...card,
          new: true as true,
        })),
    ];
  }

  if (upcomingCards.length === 0) {
    const nextTime =
      topic.learningCardsNotDue[0].learningMetrics.nextPracticeTime;
    const nextDateString = new Date(nextTime * 1000 * 60).toLocaleString();
    await alertModal.show(
      "No cards ready to study in this topic. This is because the spaced repetition " +
        "algorithm has scheduled all the cards to be studied some time in the future.\n\n" +
        `The next card in this topic is due on ${nextDateString}`
    );
    homePageLoop(homePageData, topicIndex);
    return;
  }

  session.setState({
    upcomingCards: _.shuffle(upcomingCards),
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
  if (!homePageData.practicedToday) {
    // The user *hadn't* practiced today before this session, now that they have completed the
    // session we can increase the streak by 1
    newStreak += 1;
  }

  await sessionEnd.run(homePageData.streak, newStreak);

  showHome();
};

showHome();

// If user changes the .fd file and we are showing home, update it...
// XXX Need better global app state to know whether we are on home or session
// XXX Should move to cardDAL to avoid breaking abstraction layer
fs.watch(`${fileName}`, () => {
  showHome();
});

process.stdout.on("resize", () => {
  debug.log(process.stdout.columns + " " + process.stdout.rows);
});
