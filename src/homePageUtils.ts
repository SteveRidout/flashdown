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
import * as utils from "./utils";

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
  const currentWholeDate = utils.wholeDate(currentTime);

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
        const recordWholeDate = utils.wholeDate(practiceRecord.practiceTime);
        wholeDateSet.add(utils.wholeDateToString(recordWholeDate));

        if (utils.wholeDatesAreEqual(recordWholeDate, currentWholeDate)) {
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
    utils.wholeDateFromString(rawDate)
  );

  // Calculate streak
  let streak = homePageData.practicedToday ? 1 : 0;
  let previousDay = utils.wholeDateAddDays(currentWholeDate, -1);
  while (wholeDateSet.has(utils.wholeDateToString(previousDay))) {
    streak++;
    previousDay = utils.wholeDateAddDays(previousDay, -1);
  }
  homePageData.streak = streak;

  return homePageData;
};
