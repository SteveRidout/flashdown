// 1. Read and parse the fd and fdr files
// 2. Prepare session
// 3. Save backup file
// 4. Iterate through challenges and update the original text file based on the user's responses
// 5. Show summary at end

import * as fs from "fs";
import * as _ from "lodash";

import * as keyboard from "./keyboard";
import * as practiceRecords from "./practiceRecords";
import * as spacedRepetition from "./spacedRepetition";
import { Card, Direction } from "./types";

const sleep = (duration: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(), duration);
  });

// XXX Read this from command line args instead
const baseName = "notes";

// const readlineInterface = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

const rawFlashcardsFile = fs.readFileSync(`${baseName}.fd`).toString();
const lines = rawFlashcardsFile.split("\n");

// Read practice record file if it exists
const recordsMap = practiceRecords.getRecords(baseName);
console.log(JSON.stringify(recordsMap, null, 4));

const currentTime = Math.floor(new Date().getTime() / 60 / 1000);
console.log("current time: ", new Date(currentTime * 60 * 1000));

let cardsInSession: {
  front: string;
  direction: Direction;
  new: boolean;
}[] = [];

let allScheduledCards: {
  front: string;
  direction: Direction;
  date: Date;
}[] = [];

// Get practice times and build list of cards due for review
for (const front of Object.keys(recordsMap)) {
  for (const direction of Object.keys(recordsMap[front])) {
    const records = recordsMap[front][direction];
    const nextPracticeTime = spacedRepetition.getNextPracticeTime(records);

    if (nextPracticeTime) {
      if (nextPracticeTime < currentTime) {
        cardsInSession.push({
          front,
          direction: direction as Direction,
          new: false,
        });
      }
      allScheduledCards.push({
        front,
        direction: direction as Direction,
        date: new Date(nextPracticeTime * 60 * 1000),
      });
    }
  }
}

allScheduledCards.sort((a, b) => a.date.getTime() - b.date.getTime());

console.log(allScheduledCards);

const sessionSize = 5;

// const exit = true;
// if (exit) {
//   process.exit();
// }

const flashcardRegexp = () => /(.*): (.*)/;
const sectionHeaderRegexp = () => /# (.*)/;

let currentSection: string | undefined;

const cards: Card[] = [];
const allCardsMap: { [front: string]: { [direction: string]: Card } } = {};

for (const line of lines) {
  const sectionHeaderMatch = sectionHeaderRegexp().exec(line);
  if (sectionHeaderMatch) {
    currentSection = sectionHeaderMatch[1].trim();
    continue;
  }

  const flashcardMatch = flashcardRegexp().exec(line);
  if (flashcardMatch) {
    const front = flashcardMatch[1].trim();
    const back = flashcardMatch[2].trim();

    if (!currentSection) {
      throw Error("Flashcard specified before section header");
    }

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

    allCardsMap[front] = {
      "front-to-back": frontToBack,
      "back-to-front": backToFront,
    };
    continue;
  }
}

console.log(sessionSize);

// Add new cards to make up session length
let cardIndex = 0;
while (cardsInSession.length < sessionSize) {
  if (cardIndex >= cards.length) {
    break;
  }

  const card = cards[cardIndex];
  cardIndex++;

  if (recordsMap[card.front]?.[card.direction]) {
    continue;
  }

  console.log("adding card, before: ", cardsInSession.length);
  cardsInSession.push({ ...card, new: true });
}

cardsInSession = _.shuffle(cardsInSession);

// const minutesSinceEpoch = () => Math.floor(new Date().getTime() / 1000 / 60);

// let cardIndex = Math.floor(Math.random() * cards.length);

console.log("cards in session: ", cardsInSession);
console.log("cards in session: ", cardsInSession.length);

// const a = true;
// if (a) process.exit();

let completedCount = 0;

type SessionState =
  | { type: "first-side" }
  | { type: "reveal" }
  | { type: "finished"; score: number };

const renderSession = (card: Card, state: SessionState, newCard: boolean) => {
  console.clear();
  console.log(
    `Completed ${completedCount} / ${
      cardsInSession.length +
      completedCount +
      (state.type !== "finished" ? 1 : 0)
    } cards in session`
  );
  console.log();
  console.log(`Topic: ${card.sectionTitle}`);
  console.log();
  if (newCard) {
    console.log("** NEW CARD **");
    console.log();
  }
  switch (state.type) {
    case "first-side":
      if (card.direction === "front-to-back") {
        console.log(`    ${card.front}: ?`);
      } else {
        console.log(`    ?: ${card.back}`);
      }
      console.log();
      console.log(
        `Hit space to reveal ${
          card.direction === "front-to-back" ? "back" : "front"
        } of card`
      );
      break;
    case "reveal":
    case "finished":
      const score = state.type === "finished" ? state.score : undefined;
      console.log(`    ${card.front}: ${card.back}`);
      console.log();
      console.log(
        "How well did you remember?\n" +
          (!score || score === 1 ? "1) Not at all" : "") +
          "\n" +
          (!score || score === 2 ? "2) Kinda" : "") +
          "\n" +
          (!score || score === 3 ? "3) Good" : "") +
          "\n" +
          (!score || score === 4 ? "4) Easily" : "") +
          "!"
      );
      break;
  }
};

const processNextCard = async () => {
  const cardInfo = cardsInSession.pop();
  if (!cardInfo) {
    console.log("End of session");
    process.exit();
  }
  const card = allCardsMap[cardInfo.front][cardInfo?.direction];

  renderSession(card, { type: "first-side" }, cardInfo.new);
  await keyboard.getKeypress(["space", "return"]);

  renderSession(card, { type: "reveal" }, cardInfo.new);

  const key = await keyboard.getKeypress(["1", "2", "3", "4"]);
  const score = parseInt(key, 10);

  practiceRecords.writeRecord(baseName, card, "front-to-back", score);

  // Put card back in session if the user didn't remember it...
  if (score === 1) {
    cardsInSession = [cardInfo, ...cardsInSession];
  } else {
    completedCount++;
  }

  renderSession(card, { type: "finished", score }, cardInfo.new);

  await sleep(1000);

  cardIndex++;
  processNextCard();
};

processNextCard();
