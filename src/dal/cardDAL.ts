import * as fs from "fs";

import { Card, Direction } from "../types";

export const getCards = (fileName: string): Card[] => {
  const rawFlashcardsFile = fs.readFileSync(`${fileName}`).toString();
  const lines = rawFlashcardsFile.split("\n");

  const flashcardRegexp = () => /^([^:]*): (.*)/;
  const sectionHeaderRegexp = () => /^# (.*)/;
  const ignoreRegexp = () => /\^>/;

  let currentSection: string | undefined = "Untitled";

  const cards: Card[] = [];

  for (const line of lines) {
    if (ignoreRegexp().test(line)) {
      continue;
    }
    const sectionHeaderMatch = sectionHeaderRegexp().exec(line);
    if (sectionHeaderMatch) {
      currentSection = sectionHeaderMatch[1].trim();
      continue;
    }

    const flashcardMatch = flashcardRegexp().exec(line);
    if (flashcardMatch) {
      const front = flashcardMatch[1].trim();
      const back = flashcardMatch[2].trim();

      const frontToBack = {
        front,
        back,
        direction: "front-to-back" as Direction,
        sectionTitle: currentSection,
      };
      const backToFront = {
        front,
        back,
        direction: "back-to-front" as Direction,
        sectionTitle: currentSection,
      };
      cards.push(frontToBack);
      cards.push(backToFront);
      continue;
    }
  }

  return cards;
};
