import * as _ from "lodash";

import * as flashdownFileDAL from "./dal/flashdownFileDAL";
import * as practiceRecordDAL from "./dal/practiceRecordDAL";
import { CardWithLearningMetrics, HomePageData, SessionPage } from "./types";
import * as debug from "./debug";
import * as homePageUtils from "./homePageUtils";
import * as config from "./config";
import * as appState from "./appState";
import * as flashdownFilesDAL from "./dal/flashdownFilesDAL";

export const startSession = async (
  homePageData: HomePageData,
  fileNameIndex: number,
  topicIndex: number
) => {
  const topic = homePageData.topics[fileNameIndex].data[topicIndex];

  let upcomingCards: CardWithLearningMetrics[] = topic.learningCardsDue
    .slice(0, config.get().targetCardsPerSession)
    .map((card) => ({
      ...card.card,
      new: false,
      ...card.learningMetrics,
    }));

  if (upcomingCards.length < config.get().targetCardsPerSession) {
    upcomingCards = [
      ...upcomingCards,
      ...topic.newCards
        .slice(0, config.get().targetCardsPerSession - upcomingCards.length)
        .map((card) => ({
          ...card,
          new: true as true,
        })),
    ];
  }

  if (upcomingCards.length === 0) {
    const upcomingPracticeTimes = topic.learningCardsNotDue
      .map((card) => card.learningMetrics.nextPracticeTime)
      .sort((a, b) => a - b);
    const nextTime = upcomingPracticeTimes[0];
    const nextDateString = new Date(nextTime * 1000 * 60).toLocaleString();
    showModal([
      "No cards ready to study in this topic. This is because the spaced repetition " +
        "algorithm has scheduled all the cards to be studied some time in the future.",
      "",
      `The next card in this topic is due on ${nextDateString}`,
    ]);
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

  progressToNextCard();
};

const showModal = async (message: string[]) => {
  appState.setState({
    ...appState.get(),
    modalMessage: message,
  });
};

const showSessionEnd = () => {
  const state = appState.get();

  // Show session end
  let newStreak = state.homePageData.streak;
  if (!state.homePageData.practicedToday) {
    // The user *hadn't* practiced today before this session, now that they have completed the
    // session we can increase the streak by 1
    newStreak += 1;
  }

  appState.setState({
    ...state,
    page: {
      name: "session-end",
      previousStreak: state.homePageData.streak,
      currentStreak: newStreak,
    },
  });
};

/**
 * Move to the next card in the session. The previous card will either be removed from the session
 * if it was remembered correctly, or re-inserted at the end of the session if it wasn't remembered.
 *
 * If there are no cards left in the session, this will trigger session end.
 */
export const progressToNextCard = async (previousScore?: number) => {
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
    showSessionEnd();
    return;
  }

  const missingText =
    card.direction === "front-to-back" ? card.back : card.front;

  if (missingText.length <= config.get().typingThreshold) {
    updateSessionPage({
      upcomingCards,
      completedCards,
      stage: { type: "first-side-type", input: "", cursorPosition: 0 },
    });
  } else {
    updateSessionPage({
      upcomingCards,
      completedCards,
      stage: { type: "first-side-reveal" },
    });
  }
};

export const updateSessionPage = (updateSessionPage: Partial<SessionPage>) => {
  const oldState = appState.get();
  if (oldState.page.name !== "session") {
    throw Error("Unexpected state");
  }

  const card = oldState.page.upcomingCards[0];

  switch (updateSessionPage.stage?.type) {
    case "second-side-typed":
    case "finished":
      practiceRecordDAL.writeRecord(
        card.fileName,
        card,
        card.direction,
        updateSessionPage.stage.score
      );
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
