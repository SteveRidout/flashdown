/** This module is the main entry point for the Flashdown app */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as _ from "lodash";
import { program } from "commander";

import * as keyboard from "./keyboard";
import * as cardDAL from "./dal/cardDAL";
import * as practiceRecordDAL from "./dal/practiceRecordDAL";
import { CardWithLearningMetrics, HomePageData, SessionPage } from "./types";
import * as debug from "./debug";
import * as ansiEscapes from "./ansiEscapes";
import * as homePageUtils from "./homePageUtils";
import config from "./config";
import * as utils from "./utils";
import * as appState from "./appState";
import * as gradingUtils from "./gradingUtils";

program.option("--file <filename>");
program.option("--test", "Don't write practice records");
program.parse(process.argv);
const options: {
  file?: string;
  test?: boolean;
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
  console.error;
  console.error(
    "Tip: Run Flashdown from within a directory containing a notes.fd file or use the " +
      "--file <filename> option to specify the location of your .fd file."
  );
  console.error();
  process.exit();
}

type NextStep =
  | {
      type: "next-card";
      previousScore?: number;
    }
  | { type: "finished" };

const updateSessionPage = (updateSessionPage: Partial<SessionPage>) => {
  const oldState = appState.get();
  if (oldState.page.name !== "session") {
    throw Error("Unexpected state");
  }

  appState.setState({
    ...oldState,
    page: {
      ...oldState.page,
      ...updateSessionPage,
    },
  });
};

const processNextCard = async (previousScore?: number): Promise<NextStep> => {
  let sessionPage = appState.get().page;

  if (sessionPage.name !== "session") {
    throw Error("Unexpected state");
  }

  let { upcomingCards, completedCards } = sessionPage;

  if (previousScore !== undefined) {
    if (previousScore === 1) {
      // Put card back into session since the user didn't remember it
      upcomingCards = [
        ...upcomingCards.slice(1),
        {
          ...upcomingCards[0],
          new: false,
        },
      ];
    } else {
      // Move card to completedCards list
      upcomingCards = upcomingCards.slice(1);
      completedCards = [
        ...completedCards,
        {
          ...upcomingCards[0],
          new: false,
        },
      ];
    }
  }

  const card = upcomingCards[0];

  if (!card) {
    return { type: "finished" };
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
    updateSessionPage({
      upcomingCards,
      completedCards,
      stage: { type: "first-side-type", input: "", cursorPosition: 0 },
    });

    const answer = await keyboard.readLine((input, cursorPosition) => {
      updateSessionPage({
        stage: { type: "first-side-type", input, cursorPosition },
      });
    });

    const match = gradingUtils.editDistance(
      gradingUtils.normalizeAnswer(answer),
      gradingUtils.normalizeAnswer(missingText)
    );

    score = match === "exact" ? 4 : match === "almost" ? 2 : 1;

    updateSessionPage({
      stage: { type: "second-side-typed", input: answer, score },
    });

    await keyboard.readKeypress(["space", "return"]);
  } else {
    updateSessionPage({
      upcomingCards,
      completedCards,
      stage: { type: "first-side-reveal" },
    });
    await keyboard.readKeypress(["space", "return"]);

    let selectedScore = 2;
    updateSessionPage({
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
          updateSessionPage({
            stage: {
              type: "second-side-revealed",
              selectedScore,
            },
          });
          break;

        case "down":
        case "j":
          selectedScore = Math.min(4, selectedScore + 1);
          updateSessionPage({
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

    updateSessionPage({
      stage: { type: "finished", score },
    });

    await utils.sleep(800);
  }

  debug.log("score: " + score);

  if (!options.test) {
    practiceRecordDAL.writeRecord(fileName, card, card.direction, score);
  }

  sessionPage = appState.get().page;
  if (sessionPage.name !== "session") {
    throw Error("Unexpected state");
  }

  sessionPage = appState.get().page;
  if (sessionPage.name !== "session") {
    throw Error("Unexpected state");
  }

  return { type: "next-card", previousScore: score };
};

const showHome = async () => {
  // Get home page data
  const cards = cardDAL.getCards(fileName);
  const recordsMap = practiceRecordDAL.getRecords(fileName);
  const homePageData = homePageUtils.calcHomePageData(cards, recordsMap);

  await homePageLoop(homePageData, homePageData.topics.length - 1);
};

const homePageLoop = async (homePageData: HomePageData, topicIndex: number) => {
  appState.setState({
    fileName,
    homePageData,
    page: {
      name: "home",
      selectedTopicIndex: topicIndex,
    },
  });

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

const showModal = async (message: string[]) => {
  appState.setState({
    ...appState.get(),
    modalMessage: message,
  });

  await keyboard.readKeypress(["space", "return"]);
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
    await showModal([
      "No cards ready to study in this topic. This is because the spaced repetition " +
        "algorithm has scheduled all the cards to be studied some time in the future.",
      "",
      `The next card in this topic is due on ${nextDateString}`,
    ]);
    homePageLoop(homePageData, topicIndex);
    return;
  }

  appState.setState({
    ...appState.get(),
    page: {
      name: "session",
      upcomingCards: _.shuffle(upcomingCards),
      completedCards: [],
      stage: { type: "first-side-reveal" }, // XXX This will get overwritten
    },
  });

  console.clear();

  let nextStep: NextStep = { type: "next-card" };
  while (nextStep.type === "next-card") {
    nextStep = await processNextCard(nextStep.previousScore);
  }

  // Show session end
  let newStreak = homePageData.streak;
  if (!homePageData.practicedToday) {
    // The user *hadn't* practiced today before this session, now that they have completed the
    // session we can increase the streak by 1
    newStreak += 1;
  }

  appState.setState({
    ...appState.get(),
    page: {
      name: "session-end",
      previousStreak: homePageData.streak,
      currentStreak: newStreak,
    },
  });

  await keyboard.readKeypress(["space", "return"]);

  showHome();
};

showHome();

// If user changes the .fd file and we are showing home, update it...
// XXX Need better global app state to know whether we are on home or session
// XXX Should move to cardDAL to avoid breaking abstraction layer
fs.watch(`${fileName}`, () => {
  if (appState.get().page.name === "home") {
    showHome();
  }
});

process.stdout.on("resize", () => {
  debug.log(process.stdout.columns + " " + process.stdout.rows);
});
