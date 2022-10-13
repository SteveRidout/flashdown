import { CardLearningDerivedMetrics, PracticeRecord } from "./types";

// The spaced repetition algorithm is inspired by SM2, originally used in SuperMemo and a variant of
// which is used in the popular flashcard app Anki.

// This variant changes SM2 in the following ways:
// - Only 4 answer states, like Anki (1 - 4, mapping to the keys which are used)
// - Easiness factor calculation is simplified for better readability
// - After failing a card, it is scheduled for immediate review and will be shown to the user within
//   the current session (but with other cards in between if they exist)

interface SpacedRepetitionConfig {
  initialEasinessFactor: number;

  /**
   * Time in minutes that user will wait until next seeing a card after answering with a score of 3.
   * A score of 2 results in a time half of this and a score of 4 results in double this.
   */
  firstInterval: number;
}

const defaultConfig: SpacedRepetitionConfig = {
  initialEasinessFactor: 2.5,
  firstInterval: 60 * 24,
};

export const getSpacedRepetitionInfo = (
  records: PracticeRecord[],
  config: SpacedRepetitionConfig = defaultConfig
): CardLearningDerivedMetrics | undefined => {
  let easinessFactor = config.initialEasinessFactor;
  let previous:
    | {
        time: number;
        previousInterval?: number;
        nextInterval: number;
        score: number;
      }
    | undefined;
  let nextPracticeTime: number | undefined;

  for (const record of records) {
    if (previous !== undefined && record.practiceTime < previous.time) {
      throw Error("Practice records not in chronological order");
    }

    const easinessDelta = (() => {
      switch (record.score) {
        case 1:
          return -0.8;
        case 2:
          return -0.2;
        case 3:
          return 0;
        case 4:
          return 0.1;
        default:
          throw Error("Invalid score");
      }
    })();

    easinessFactor = Math.max(1.3, easinessFactor + easinessDelta);

    const previousInterval =
      previous === undefined ? undefined : record.practiceTime - previous.time;

    const nextInterval = (() => {
      switch (record.score) {
        case 1:
          // Schedule for 6 hours time
          return 6 * 60;
        case 2:
        case 3:
        case 4:
          if (previousInterval === undefined || previous === undefined) {
            // Schedule for the next day
            return config.firstInterval * Math.pow(2, record.score - 3);
          }

          const interval = previousInterval * easinessFactor;

          // Since the user got this right, let's ensure that the next interval can't decrease
          // compared to the previous one. This is only for the case where the user happened to
          // practice before the scheduled time, e.g. perhaps they are cramming before an exam.
          return Math.max(previous.nextInterval, interval);
        default:
          throw Error("Invalid score");
      }
    })();

    nextPracticeTime = record.practiceTime + nextInterval;

    previous = {
      time: record.practiceTime,
      score: record.score,
      previousInterval,
      nextInterval,
    };
  }

  if (!previous || !nextPracticeTime) {
    return undefined;
  }

  return {
    previousInterval: previous.previousInterval,
    previousScore: previous.score,
    nextPracticeTime,
    easinessFactor,
  };
};
