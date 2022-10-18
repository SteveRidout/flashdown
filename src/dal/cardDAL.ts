/**
 * This module is responsible for parsing the Flashdown files (.fd) which specify the contents of the
 * flashcards
 */
import * as fs from "fs";

import { Card, Direction } from "../types";

export const getCards = (fileName: string): Card[] => {
  const rawFlashcardsFile = fs.readFileSync(`${fileName}`).toString();
  const lines = rawFlashcardsFile.split("\n");

  const commentRegexp = () => /\w*\/\//;
  const flashcardRegexp = () => /^([^:]*): (.*)/;
  const sectionHeaderRegexp = () => /^# (.*)/;
  const noteRegexp = () => /^  ([^ ].*)/;

  let currentSection: string | undefined = "Untitled";

  const cards: Card[] = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    if (commentRegexp().test(line)) {
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

      // Check following line for a potential note
      const note: string | undefined = (() => {
        const noteMatch = noteRegexp().exec(lines[lineIndex + 1]);
        if (noteMatch) {
          lineIndex++;
          return noteMatch[1];
        }
        return undefined;
      })();

      const frontToBack = {
        front,
        back,
        direction: "front-to-back" as Direction,
        sectionTitle: currentSection,
        note,
      };
      const backToFront = {
        front,
        back,
        direction: "back-to-front" as Direction,
        sectionTitle: currentSection,
        note,
      };
      cards.push(frontToBack);
      cards.push(backToFront);
      continue;
    }
  }

  return cards;
};
