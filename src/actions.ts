import * as _ from "lodash";

import * as keyboard from "./keyboard";
import * as flashdownFileDAL from "./dal/flashdownFileDAL";
import * as practiceRecordDAL from "./dal/practiceRecordDAL";
import { CardWithLearningMetrics, HomePageData, SessionPage } from "./types";
import * as debug from "./debug";
import * as homePageUtils from "./homePageUtils";
import config from "./config";
import * as utils from "./utils";
import * as appState from "./appState";
import * as gradingUtils from "./gradingUtils";
import * as flashdownFilesDAL from "./dal/flashdownFilesDAL";

export const startSession = async (
  homePageData: HomePageData,
  fileNameIndex: number,
  topicIndex: number
) => {
  const topic = homePageData.topics[fileNameIndex].data[topicIndex];

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
    updateHomePage(fileNameIndex, topicIndex);
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

const showModal = async (message: string[]) => {
  appState.setState({
    ...appState.get(),
    modalMessage: message,
  });

  await keyboard.readKeypress(["space", "return"]);
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
      const keyName = (
        await keyboard.readKeypress([
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
        ])
      ).key.name;
      switch (keyName) {
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
          finalScore = parseInt(keyName, 10);
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

  if (!config.test) {
    practiceRecordDAL.writeRecord(card.fileName, card, card.direction, score);
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

export const showHome = async () => {
  const fileNames = flashdownFilesDAL.getFileNames();

  // Get home page data
  const cards = fileNames.map((fileName) =>
    flashdownFileDAL.getCards(fileName)
  );
  const recordsMap = fileNames.reduce(
    (memo, fileName) => ({
      ...memo,
      [fileName]: practiceRecordDAL.getRecords(fileName),
    }),
    {}
  );
  const homePageData = homePageUtils.calcHomePageData(cards, recordsMap);
  debug.log(
    JSON.stringify(
      homePageData.topics.map(
        (t) => `${t.fileName} - ${t.data.map((d) => d.name)}`
      )
    )
  );

  appState.setState({
    homePageData,
    page: {
      name: "home",
      selectedFileNameIndex: homePageData.topics.length - 1,
      selectedTopicIndex: 0,
    },
  });
};

export const updateHomePage = (fileNameIndex: number, topicIndex: number) => {
  const state = appState.get();

  if (state.page.name !== "home") {
    throw Error("Unexpected state");
  }

  appState.setState({
    homePageData: state.homePageData,
    page: {
      name: "home",
      selectedFileNameIndex: fileNameIndex,
      selectedTopicIndex: topicIndex,
    },
  });
};
