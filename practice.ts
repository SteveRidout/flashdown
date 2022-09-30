// 1. Read and parse the fd and fdr files
// 2. Prepare session
// 3. Save backup file
// 4. Iterate through challenges and update the original text file based on the user's responses
// 5. Show summary at end

import * as _ from "lodash";
import * as readline from "readline";

import * as keyboard from "./keyboard";
import * as cardDAL from "./dal/cardDAL";
import * as practiceRecordDAL from "./dal/practiceRecordDAL";
import * as spacedRepetition from "./spacedRepetition";
import { Card, Direction } from "./types";
import { isLineBreak } from "typescript";

// XXX Read this from command line args instead
const baseName = "notes";

const sleep = (duration: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(), duration);
  });

// const readlineInterface = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

// const askQuestion = (question: string): Promise<string> => {
//   return new Promise((resolve) => {
//     readlineInterface.question(question, (answer) => {
//       // readlineInterface.close();
//       resolve(answer);
//     });
//   });
// };

/** If number of characters in answer is less than this, use typing mode. */
const typingThreshold = 20;

// Read practice record file if it exists
const recordsMap = practiceRecordDAL.getRecords(baseName);
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

const sessionSize = 10;

const cards = cardDAL.getCards(baseName);

console.log("Scheduled cards: ", cardsInSession);

const allCardsMap: { [front: string]: { [direction: string]: Card } } = {};

for (const card of cards) {
  allCardsMap[card.front] = allCardsMap[card.front] ?? {};
  allCardsMap[card.front] = {
    ...(allCardsMap[card.front] ?? {}),
    [card.direction]: card,
  };
}

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

console.log("cards in session: ", cardsInSession);
console.log("cards in session: ", cardsInSession.length);

let completedCount = 0;

type SessionState =
  | { type: "first-side-reveal" }
  | { type: "first-side-type" }
  | { type: "second-side-revealed" }
  | { type: "second-side-typed"; score: number }
  | { type: "finished"; score: number };

const blankText = (input: string) =>
  input
    .split("")
    .map(() => "_")
    .join("");

const question = async (questionText: string): Promise<string> => {
  console.log(questionText);
  const line = await keyboard.readLine(
    (input: string, cursorPosition: number) => {
      process.stdout.moveCursor(0, -1);
      process.stdout.clearScreenDown();
      process.stdout.write(`\n${input}`);

      // XXX Don't hard code this 9!!!
      readline.cursorTo(process.stdin, cursorPosition, 9);
    }
  );

  console.log("got line: ", line);

  return line;
};

const renderSession = (card: Card, state: SessionState, newCard: boolean) => {
  console.clear();
  const totalCards =
    cardsInSession.length +
    completedCount +
    (state.type !== "finished" ? 1 : 0);
  console.log(
    `Progress: ${Math.floor(
      (100 * completedCount) / totalCards
    )}% (${completedCount} / ${totalCards})`
  );
  console.log();
  if (newCard) {
    console.log("    ** NEW CARD **");
  }
  console.log();
  console.log(`    Topic: ${card.sectionTitle}`);
  console.log();
  switch (state.type) {
    case "first-side-reveal":
    case "first-side-type":
      const cardContent =
        card.direction === "front-to-back"
          ? `${card.front}: ${blankText(card.back)}`
          : `${blankText(card.front)}: ${card.back}`;
      console.log(`    ${cardContent}`);
      if (state.type === "first-side-reveal") {
        console.log();
        console.log(
          `Hit space to reveal ${
            card.direction === "front-to-back" ? "back" : "front"
          } of card`
        );
      }
      break;
    case "second-side-typed":
      console.log(`    ${card.front}: ${card.back}`);
      console.log();
      if (state.score > 3) {
        console.log("Well done!");
      } else {
        console.log("Wrong");
      }
      console.log();
      console.log("Hit space to continue");
      break;
    case "second-side-revealed":
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
  const card = allCardsMap[cardInfo.front]?.[cardInfo?.direction];

  if (!card) {
    console.clear();
    console.log("Card missing: ", cardInfo.front);
    console.log("Hit space to continue");
    await keyboard.readKeypress(["space", "return"]);
    cardIndex++;
    processNextCard();
    return;
  }

  const missingText =
    card.direction === "front-to-back" ? card.back : card.front;

  let score: number;

  if (missingText.length <= typingThreshold) {
    renderSession(card, { type: "first-side-type" }, cardInfo.new);

    console.log();
    const answer = await question(
      "Type the missing answer followed by Enter:\n"
    );

    console.log("got answer: ", answer);

    score =
      answer.toLowerCase().trim() === missingText.toLowerCase().trim() ? 4 : 1;

    renderSession(card, { type: "second-side-typed", score }, cardInfo.new);

    await keyboard.readKeypress(["space", "return"]);
  } else {
    renderSession(card, { type: "first-side-reveal" }, cardInfo.new);
    await keyboard.readKeypress(["space", "return"]);

    renderSession(card, { type: "second-side-revealed" }, cardInfo.new);

    const key = await keyboard.readKeypress(["1", "2", "3", "4"]);
    score = parseInt(key, 10);

    renderSession(card, { type: "finished", score }, cardInfo.new);

    await sleep(1000);
  }

  practiceRecordDAL.writeRecord(baseName, card, cardInfo.direction, score);

  // Put card back in session if the user didn't remember it...
  if (score === 1) {
    cardsInSession = [cardInfo, ...cardsInSession];
  } else {
    completedCount++;
  }

  cardIndex++;
  processNextCard();
};

processNextCard();
