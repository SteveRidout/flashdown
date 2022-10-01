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
import * as session from "./session";

// XXX Read this from command line args instead
const baseName = "notes";

const sleep = (duration: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(), duration);
  });

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

// type SessionState =
//   | { type: "first-side-reveal" }
//   | { type: "first-side-type" }
//   | { type: "second-side-revealed" }
//   | { type: "second-side-typed"; score: number }
//   | { type: "finished"; score: number };

// const blankText = (input: string) =>
//   input
//     .split("")
//     .map(() => "_")
//     .join("");

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

  return line;
};

(() => {
  const upcomingCards: (Card & { new: boolean })[] = cardsInSession
    .map((cardInfo) => {
      const card = allCardsMap[cardInfo.front]?.[cardInfo?.direction];
      if (!card) {
        return undefined;
      }

      return {
        ...card,
        new: cardInfo.new,
      };
    })
    .filter((card) => card !== undefined) as (Card & { new: boolean })[];

  session.setState({
    upcomingCards,
    completedCards: [],
    stage: { type: "first-side-reveal" }, // XXX This will get overwritten
  });
})();

const processNextCard = async () => {
  const card = session.state.upcomingCards[0];

  if (!card) {
    console.clear();
    console.log("You finished!");
    return;
  }

  const missingText =
    card.direction === "front-to-back" ? card.back : card.front;

  let score: number;

  if (missingText.length <= typingThreshold) {
    session.setState({
      ...session.state,
      stage: { type: "first-side-type", input: "", cursorPosition: 0 },
    });

    const answer = await keyboard.readLine((input, cursorPosition) => {
      session.setState({
        ...session.state,
        stage: { type: "first-side-type", input, cursorPosition },
      });
    });

    score =
      answer.toLowerCase().trim() === missingText.toLowerCase().trim() ? 4 : 1;

    session.setState({
      ...session.state,
      stage: { type: "second-side-typed", score },
    });

    await keyboard.readKeypress(["space", "return"]);
  } else {
    session.setState({
      ...session.state,
      stage: { type: "first-side-reveal" },
    });
    await keyboard.readKeypress(["space", "return"]);

    session.setState({
      ...session.state,
      stage: { type: "second-side-revealed" },
    });

    const key = await keyboard.readKeypress(["1", "2", "3", "4"]);
    score = parseInt(key, 10);

    session.setState({
      ...session.state,
      stage: { type: "finished", score },
    });

    await sleep(1000);
  }

  practiceRecordDAL.writeRecord(baseName, card, card.direction, score);

  if (score === 1) {
    // Put card back into session since the user didn't remember it
    session.setState({
      ...session.state,
      upcomingCards: [...session.state.upcomingCards.slice(1), card],
    });
  } else {
    // Move card to completedCards list
    session.setState({
      ...session.state,
      upcomingCards: session.state.upcomingCards.slice(1),
      completedCards: [...session.state.completedCards, card],
    });
  }

  // Put car

  processNextCard();
};

processNextCard();
