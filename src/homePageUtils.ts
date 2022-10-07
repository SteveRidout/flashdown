import * as _ from "lodash";

import {
  Card,
  CardLearningDerivedMetrics,
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
    practiceHistory: [],
    practicedToday: false,
    streak: 0,
  };

  const allTopics: TopicData = {
    name: "All Topics",
    newCards: [],
    learningCardsNotDue: [],
    learningCardsDue: [],
    masteryScore: 0,
  };

  const wholeDateSet: Set<string> = new Set();

  for (const card of cards) {
    const learningMetrics: CardLearningDerivedMetrics | undefined = (() => {
      const practiceRecords = recordMap[card.front]?.[card.direction];

      if (practiceRecords === undefined) {
        return undefined;
      }

      for (const practiceRecord of practiceRecords) {
        const recordWholeDate = wholeDate(practiceRecord.practiceTime);
        wholeDateSet.add(wholeDateToString(recordWholeDate));

        if (wholeDatesAreEqual(recordWholeDate, currentWholeDate)) {
          homePageData.practicedToday = true;
        }
      }

      return spacedRepetition.getSpacedRepetitionInfo(practiceRecords);
    })();

    // Add card to home page data:
    const topicName = card.sectionTitle;
    topicMap[topicName] = topicMap[topicName] ?? emptyTopic(topicName);

    if (learningMetrics === undefined) {
      allTopics.newCards.push(card);
      topicMap[topicName].newCards.push(card);
    } else if (learningMetrics.nextPracticeTime < currentTime) {
      allTopics.learningCardsDue.push({ card, learningMetrics });
      topicMap[topicName].learningCardsDue.push({
        card,
        learningMetrics,
      });
    } else {
      allTopics.learningCardsNotDue.push({
        card,
        learningMetrics,
      });
      topicMap[topicName].learningCardsNotDue.push({
        card,
        learningMetrics,
      });
    }
  }

  homePageData.topics = Object.values(topicMap);

  if (homePageData.topics.length > 1) {
    homePageData.topics.push(allTopics);
  }

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

  return homePageData;
};
