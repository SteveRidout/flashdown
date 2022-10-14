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

  /**
   * This starts at a fixed value for each card and increases or decreases based on whether the
   * user remembered the information and how easily they remembered it
   */
  easinessFactor: number;
}

export type Direction = "front-to-back" | "back-to-front";

export interface TextWithCursor {
  /** Each element in this array should represent a single line. No newline characters allowed! */
  lines: string[];
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
  practiceHistory: WholeDate[];
  streak: number;
  practicedToday: boolean;
}

export interface WholeDate {
  year: number;
  month: number;
  day: number;
}

export type CardWithLearningMetrics = Card & { new: boolean } & (
    | {}
    | CardLearningDerivedMetrics
  );

export type CardStage =
  | { type: "first-side-reveal" }
  | { type: "first-side-type"; input: string; cursorPosition: number }
  | { type: "second-side-revealed"; selectedScore: number }
  | { type: "second-side-typed"; input: string; score: number }
  | { type: "finished"; score: number };

export interface SessionPage {
  name: "session";
  upcomingCards: CardWithLearningMetrics[];
  completedCards: CardWithLearningMetrics[];
  stage: CardStage;
}

export interface HomePage {
  name: "home";
  selectedTopicIndex: number;
}

export interface SessionEndPage {
  name: "session-end";
}

export interface AppState {
  fileName: string;
  homePageData: HomePageData;

  page: SessionPage | HomePage | SessionEndPage;
}
