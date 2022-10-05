// 1. Read and parse the fd and fdr files
// 2. Prepare session
// 3. Save backup file
// 4. Iterate through challenges and update the original text file based on the user's responses
// 5. Show summary at end

import * as _ from "lodash";

import * as keyboard from "./src/keyboard";
import * as cardDAL from "./src/dal/cardDAL";
import * as practiceRecordDAL from "./src/dal/practiceRecordDAL";
import * as spacedRepetition from "./src/spacedRepetition";
import { Card, Direction } from "./src/types";
import * as session from "./src/session";
import * as debug from "./src/debug";
import * as ansiEscapes from "./src/ansiEscapes";
import * as homePageUtils from "./src/homePageUtils";
import config from "./src/config";

process.stdout.write(ansiEscapes.enableAlternativeBuffer);

debug.log("--------------");
debug.log("Start practice");
debug.log("--------------");

// XXX Read this from command line args instead
const baseName = "notes";

const sleep = (duration: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(), duration);
  });

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
    if (cardsInSession.length >= config.targetCardsPerSession) {
      break;
    }

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

debug.log(`cards in session before new: ` + cardsInSession.length);

// Add new cards to make up session length
let cardIndex = 0;
while (cardsInSession.length < config.targetCardsPerSession) {
  if (cardIndex >= cards.length) {
    break;
  }

  const card = cards[cardIndex];
  cardIndex++;

  if (recordsMap[card.front]?.[card.direction]) {
    continue;
  }

  cardsInSession.push({ ...card, new: true });
}

cardsInSession = _.shuffle(cardsInSession);

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

  if (upcomingCards.length === 0) {
    console.log("No cards available");
    process.exit();
  }

  session.setState({
    upcomingCards,
    completedCards: [],
    stage: { type: "first-side-reveal" }, // XXX This will get overwritten
  });
})();

const processNextCard = async () => {
  const card = session.state.upcomingCards[0];

  if (!card) {
    // console.clear();
    // console.log("You finished!");
    console.log("Hit SPACE to continue");
    await keyboard.readKeypress(["space", "return"]);
    showHome();
    return;
  }
  debug.log("Next card: " + JSON.stringify(card));

  const missingText =
    card.direction === "front-to-back" ? card.back : card.front;

  let score: number;

  if (!card.new && missingText.length <= config.typingThreshold) {
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
      upcomingCards: [
        ...session.state.upcomingCards.slice(1),
        {
          ...card,
          new: false,
        },
      ],
    });
  } else {
    // Move card to completedCards list

    debug.log("moving card to completed: " + card.front);
    session.setState({
      ...session.state,
      upcomingCards: session.state.upcomingCards.slice(1),
      completedCards: [
        ...session.state.completedCards,
        {
          ...card,
          new: false,
        },
      ],
    });
    debug.log("moved card to completed: " + card.front);
  }

  debug.log(
    "process next card. upcoming: " + session.state.upcomingCards.length
  );
  processNextCard();
};

// const pluralizeWord = (word: string, number: number) =>
//   `${word}${number === 1 ? "" : "s"}`;

const showHome = async () => {
  const homePageData = homePageUtils.calcHomePageData(cards, recordsMap);

  console.clear();
  console.log("Welcome to Flashdown! (beta v0.1)");
  console.log("---------------------");
  console.log();
  if (homePageData.streak > 0) {
    console.log("practiced today: ", homePageData.practicedToday);
    const callToAction = homePageData.practicedToday
      ? ", return tomorrow to avoid losing it!"
      : "";

    console.log(`You have a ${homePageData.streak} day streak${callToAction}`);
    console.log();
  }
  console.log("New cards: ", homePageData.allTopics.newCards.length);
  console.log(
    "Due for review: ",
    homePageData.allTopics.learningCardsDue.length
  );
  console.log(
    "Scheduled for the future: ",
    homePageData.allTopics.learningCardsNotDue.length
  );
  console.log(
    "Topics: ",
    homePageData.topics.map((topic) => topic.name)
  );

  console.log("Hit SPACE to start learning");
  await keyboard.readKeypress(["space", "return"]);

  console.clear();
  processNextCard();
};

showHome();
