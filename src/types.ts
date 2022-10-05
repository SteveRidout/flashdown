export interface PracticeRecord {
  practiceTime: number; // In minutes from epoch
  score: number; // from 0 (bad) to 3 (good)
}

export interface Card {
  front: string;
  back: string;
  direction: Direction;
  sectionTitle: string;
}

/** These are metrics derived from the list of practice records. */
export interface CardLearningDerivedMetrics {
  // practiceRecords: PracticeRecord[];

  /**
   * This is the interval before the previous practice with this card, or undefined if this was
   * the user's first time practicing this card.
   */
  previousInterval?: number;

  /** This is the previous score achieved on this card */
  previousScore: number;

  /** The next scheduled time in minutes since epoch */
  nextPracticeTime: number;
}

export type Direction = "front-to-back" | "back-to-front";

export interface TextWithCursor {
  text: string;
  cursorPosition?: {
    x: number;
    y: number;
  };
}

export interface TopicData {
  name: string;
  newCards: Card[];
  learningCardsNotDue: {
    card: Card;
    learningMetrics: CardLearningDerivedMetrics;
  }[];
  learningCardsDue: {
    card: Card;
    learningMetrics: CardLearningDerivedMetrics;
  }[];
  masteryScore: number; // percentage of cards with >99% chance of remembering
}

export interface HomePageData {
  topics: TopicData[];
  allTopics: TopicData;
  practiceHistory: WholeDate[];
  streak: number;
  practicedToday: boolean;
}

export interface WholeDate {
  year: number;
  month: number;
  day: number;
}
