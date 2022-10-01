import * as readline from "readline";

import { Card } from "./types";

type CardStage =
  | { type: "first-side-reveal" }
  | { type: "first-side-type"; input: string; cursorPosition: number }
  | { type: "second-side-revealed" }
  | { type: "second-side-typed"; score: number }
  | { type: "finished"; score: number };

interface State {
  upcomingCards: (Card & { new: boolean })[];
  completedCards: (Card & { new: boolean })[];
  stage: CardStage;
}

/** Important: never set this directly, always set via the setState() function */
export let state: State;

const blankText = (input: string) =>
  input
    .split("")
    .map(() => "_")
    .join("");

const underlines = (length: number) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += "_";
  }
  return result;
};

const inputText = (input: string, target: string) => {
  return `${input}${underlines(target.length - input.length + 3)}`;
};

const render = () => {
  const { upcomingCards, completedCards, stage } = state;
  console.clear();

  const lines: string[] = [];

  const totalCards =
    upcomingCards.length +
    completedCards.length +
    (stage.type !== "finished" ? 1 : 0);
  lines.push(
    `Progress: ${Math.floor((100 * completedCards.length) / totalCards)}% (${
      completedCards.length
    } / ${totalCards})`
  );

  const card = upcomingCards[0];

  let setCursorTo: { x: number; y: number } | undefined = undefined;

  lines.push("");

  if (card.new) {
    lines.push("    ** NEW CARD **");
  }
  lines.push("");
  lines.push(`    Topic: ${card.sectionTitle}`);
  lines.push("");
  switch (stage.type) {
    case "first-side-reveal":
      lines.push(
        `    ${
          card.direction === "front-to-back"
            ? `${card.front}: ${blankText(card.back)}`
            : `${blankText(card.front)}: ${card.back}`
        }`
      );
      lines.push("");
      lines.push(
        `Hit space to reveal ${
          card.direction === "front-to-back" ? "back" : "front"
        } of card`
      );
      break;
    case "first-side-type": {
      let cardContent = "";
      if (card.direction === "front-to-back") {
        cardContent = `${card.front}: `;
        setCursorTo = {
          x: 4 + cardContent.length + stage.cursorPosition,
          y: lines.length,
        };
        cardContent += `${inputText(stage.input, card.back)}`;
      } else {
        cardContent = `${inputText(stage.input, card.front)}: ${card.back}`;
        setCursorTo = { x: 4 + stage.cursorPosition, y: lines.length };
      }
      lines.push(`    ${cardContent}`);
      lines.push("");
      lines.push("Type the missing answer followed by Enter");
      break;
    }
    case "second-side-typed":
      lines.push(`    ${card.front}: ${card.back}`);
      lines.push("");
      if (stage.score > 3) {
        lines.push("Well done!");
      } else {
        lines.push("Wrong");
      }
      lines.push();
      lines.push("Hit space to continue");
      break;
    case "second-side-revealed":
    case "finished":
      const score = stage.type === "finished" ? stage.score : undefined;
      lines.push(`    ${card.front}: ${card.back}`);
      lines.push();
      lines.push(
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

  console.log(lines.join("\n"));

  if (setCursorTo) {
    readline.cursorTo(process.stdout, setCursorTo.x, setCursorTo.y);
  }
};

export const setState = (newState: State) => {
  state = newState;
  render();
};
