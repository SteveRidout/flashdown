import * as _ from "lodash";

import * as config from "./config";
import {
  Card,
  CardLearningDerivedMetrics,
  HomePageData,
  PracticeRecord,
  TopicData,
} from "./types";
import * as spacedRepetition from "./spacedRepetition";
import * as utils from "./utils";
import * as debug from "./debug";
import { getConfigFileParsingDiagnostics } from "typescript";

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
  cardsByTopic: Card[][],
  recordMap: {
    [fileName: string]: {
      [front: string]: { [direction: string]: PracticeRecord[] };
    };
  }
): HomePageData => {
  const currentTime = Math.floor(new Date().getTime() / (60 * 1000));
  const currentWholeDate = utils.wholeDate(currentTime);

  const topicMap: { [fileName: string]: TopicMap } = {};
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

  for (const cards of cardsByTopic) {
    const fileName = cards[0].fileName;
    topicMap[fileName] = {};
    for (const card of cards) {
      const practiceRecords =
        recordMap[card.fileName][card.front]?.[card.direction];

      const learningMetrics: CardLearningDerivedMetrics | undefined = (() => {
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

        return spacedRepetition.getSpacedRepetitionInfo(practiceRecords, {
          jitter: config.get().jitter,
          jitterRandomSeed: [card.front, card.direction].join("-"),
        });
      })();

      // Add card to home page data:
      const topicName = card.sectionTitle;
      topicMap[fileName][topicName] =
        topicMap[fileName][topicName] ?? emptyTopic(topicName);

      if (learningMetrics === undefined) {
        allTopics.newCards.push(card);
        topicMap[fileName][topicName].newCards.push(card);
      } else if (learningMetrics.nextPracticeTime < currentTime) {
        allTopics.learningCardsDue.push({
          card,
          learningMetrics,
          practiceRecords,
        });
        topicMap[fileName][topicName].learningCardsDue.push({
          card,
          learningMetrics,
          practiceRecords,
        });
      } else {
        allTopics.learningCardsNotDue.push({
          card,
          learningMetrics,
          practiceRecords,
        });
        topicMap[fileName][topicName].learningCardsNotDue.push({
          card,
          learningMetrics,
          practiceRecords,
        });
      }
    }
  }

  homePageData.topics = Object.keys(topicMap).map((fileName) => {
    return {
      fileName,
      data: Object.values(topicMap[fileName]),
    };
  });

  const totalTopics = homePageData.topics.reduce(
    (memo, topic) => memo + topic.data.length,
    0
  );

  if (totalTopics > 1) {
    homePageData.topics.push({
      fileName: "",
      data: [allTopics],
    });
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
