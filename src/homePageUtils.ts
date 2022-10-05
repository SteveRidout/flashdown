import * as _ from "lodash";

import {
  Card,
  HomePageData,
  PracticeRecord,
  TopicData,
  WholeDate,
} from "./types";
import * as spacedRepetition from "./spacedRepetition";

interface TopicMap {
  [name: string]: TopicData;
}

const emptyTopic = (name: string) => ({
  name,
  newCards: [],
  learningCardsNotDue: [],
  learningCardsDue: [],
  masteryScore: 0,
});

const wholeDate = (timeInMinutes: number): WholeDate => {
  const date = new Date(timeInMinutes * 60 * 1000);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
};

const wholeDateToString = (wholeDate: WholeDate): string =>
  `${wholeDate.year}-${_.padStart(
    wholeDate.month.toString(),
    2,
    "0"
  )}-${_.padStart(wholeDate.day.toString(), 2, "0")}`;

const wholeDateFromString = (rawWholeDate: string): WholeDate => {
  const [year, month, day] = rawWholeDate
    .split("-")
    .map((raw) => parseInt(raw, 10));

  return {
    year,
    month,
    day,
  };
};

const wholeDatesAreEqual = (a: WholeDate, b: WholeDate): boolean =>
  a.year === b.year && a.month === b.month && a.day === b.day;

const wholeDateAddDays = (wholeDate: WholeDate, days: number): WholeDate => {
  const { year, month, day } = wholeDate;
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
};

export const calcHomePageData = (
  cards: Card[],
  recordMap: { [front: string]: { [direction: string]: PracticeRecord[] } }
): HomePageData => {
  const cardMap: { [front: string]: { [direction: string]: Card } } = {};

  for (const card of cards) {
    cardMap[card.front] = {
      ...(cardMap[card.front] ?? {}),
      [card.direction]: card,
    };
  }

  const currentTime = Math.floor(new Date().getTime() / (60 * 1000));
  const currentWholeDate = wholeDate(currentTime);

  const topicMap: TopicMap = {};
  const homePageData: HomePageData = {
    topics: [],
    allTopics: {
      name: "All Cards",
      newCards: [],
      learningCardsNotDue: [],
      learningCardsDue: [],
      masteryScore: 0,
    },
    practiceHistory: [],
    practicedToday: false,
    streak: 0,
  };

  const wholeDateSet: Set<string> = new Set();

  for (const front of Object.keys(recordMap)) {
    for (const direction of Object.keys(recordMap[front])) {
      const card = cardMap[front][direction];

      if (card === undefined) {
        throw Error(
          `No card found corresponding to record: ${front}, ${direction}`
        );
      }

      const practiceRecords = recordMap[front][direction];

      for (const practiceRecord of practiceRecords) {
        const recordWholeDate = wholeDate(practiceRecord.practiceTime);
        wholeDateSet.add(wholeDateToString(recordWholeDate));

        console.log("comparing: ", recordWholeDate, currentWholeDate);

        if (wholeDatesAreEqual(recordWholeDate, currentWholeDate)) {
          homePageData.practicedToday = true;
        }
      }

      const learningMetrics =
        spacedRepetition.getSpacedRepetitionInfo(practiceRecords);

      // Add card to home page data:
      const topicName = card.sectionTitle;
      topicMap[topicName] = topicMap[topicName] ?? emptyTopic(topicName);

      if (learningMetrics === undefined) {
        homePageData.allTopics.newCards.push(card);
        topicMap[topicName].newCards.push(card);
      } else if (learningMetrics.nextPracticeTime < currentTime) {
        homePageData.allTopics.learningCardsDue.push({ card, learningMetrics });
        topicMap[topicName].learningCardsNotDue.push({
          card,
          learningMetrics,
        });
      } else {
        homePageData.allTopics.learningCardsNotDue.push({
          card,
          learningMetrics,
        });
        topicMap[topicName].learningCardsNotDue.push({
          card,
          learningMetrics,
        });
      }
    }
  }

  homePageData.topics = Object.values(topicMap);

  const rawDates: string[] = Array.from(wholeDateSet);
  rawDates.sort();
  homePageData.practiceHistory = rawDates.map((rawDate) =>
    wholeDateFromString(rawDate)
  );

  // Calculate streak
  let streak = homePageData.practicedToday ? 1 : 0;
  let previousDay = wholeDateAddDays(currentWholeDate, -1);
  while (wholeDateSet.has(wholeDateToString(previousDay))) {
    streak++;
    previousDay = wholeDateAddDays(previousDay, -1);
  }
  homePageData.streak = streak;

  // process.exit();
  return homePageData;
};
