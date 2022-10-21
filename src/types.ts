export interface PracticeRecord {
  practiceTime: number; // In minutes from epoch
  score: number; // from 0 (bad) to 3 (good)
}

export interface Card {
  front: string;
  back: string;
  direction: Direction;
  sectionTitle: string;
  note?: string;
  fileName: string;
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
  topics: {
    fileName: string;
    data: TopicData[];
  }[];
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
  selectedFileNameIndex: number;
  selectedTopicIndex: number;
}

export interface SessionEndPage {
  name: "session-end";
  previousStreak: number;
  currentStreak: number;
}

export interface OnboardingPage {
  name: "onboarding";
}

export interface AppState {
  homePageData: HomePageData;

  page: SessionPage | HomePage | SessionEndPage | OnboardingPage;

  modalMessage?: string[];
}

export type Animation =
  | {
      type: "frames";
      position: {
        x: number;
        y: number;
      };
      frames: string[];
      initialDelay: number;
      frameDuration: number;
    }
  | {
      type: "horizontal-pan";
      yRange: {
        start: number;
        end: number;
      };
    };

export interface KeyPressInfo {
  sequence: string;
  name: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
}

/** Returns true if handled, false if not handled and we should continue listening */
export type KeyPressHandler = (str: string, key: KeyPressInfo) => boolean;

export interface TerminalViewModel {
  textWithCursor: TextWithCursor;
  animations: Animation[];
  keyPressHandler?: KeyPressHandler;
}

export type FilesStatus = "user-specified-file-not-found" | "files-found";
