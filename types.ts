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

export type Direction = "front-to-back" | "back-to-front";
