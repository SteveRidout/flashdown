// Designed to be run directly with ts-node for now since we don't have a proper unit testing
// framework set up yet.

import * as session from "./session";

const testTextWithCursor = {
  text: "Heading\n\nThis is some test text with a blank here _______ and this is the end.",
  cursorPosition: {
    x: 40,
    y: 2,
  },
};

const testTextWithoutCursor = {
  text: "Heading\n\nThis is some test text without a blank and a cursor.",
};

const testCardBody = {
  text: "Topic: Spanish words\n\nLa puta madre: The whore mother (that's awesome!)",
};

const testCardBodyWithCursor = {
  text: "Topic: Spanish words\n\nLa puta madre: __________________________________",
  cursorPosition: {
    x: 15,
    y: 2,
  },
};

console.log("Test splitIntoLines");
console.log(session.splitIntoLines(testTextWithoutCursor));
console.log(session.splitIntoLines(testTextWithCursor));

console.log();
console.log("Test reflowText 30");
console.log(session.reflowText(testTextWithoutCursor, 30).text);
console.log("-----");
console.log();

console.log("Test reflowText 20");
console.log(session.reflowText(testTextWithoutCursor, 20).text);
console.log("-----");
console.log();

console.log("Test reflowText 30 with cursor position");
console.log("|----------------------------|");
(() => {
  const textWithCursor = session.reflowText(testTextWithCursor, 30);
  console.log(textWithCursor.text);
  console.log(textWithCursor.cursorPosition);
})();
console.log("|----------------------------|");

console.log("Test reflowText 15 with cursor position");
console.log("|-------------|");
(() => {
  const textWithCursor = session.reflowText(testTextWithCursor, 15);
  console.log(textWithCursor.text);
  console.log(textWithCursor.cursorPosition);
})();
console.log("|-------------|");

console.log("Test reflow with cursor position");
console.log("|-------------|");
(() => {
  const textWithCursor = session.reflowText(
    {
      text: "What was the total electricity consumption of Spain in 2018? : _______",
      cursorPosition: { x: 63, y: 0 },
    },
    50
  );
  console.log(textWithCursor.text);
  console.log(textWithCursor.cursorPosition);
})();
console.log("|-------------|");

process.exit();

console.log("Test addFrame 20");
console.log("|-------------|");
(() => {
  const textWithCursor = session.addFrame(testCardBody, 30);
  console.log(textWithCursor.text);
  console.log(textWithCursor.cursorPosition);
})();
console.log("|-------------|");

console.log("Test addFrame 20 with cursor position");
console.log("|-------------|");
(() => {
  const textWithCursor = session.addFrame(testCardBodyWithCursor, 30);
  console.log(textWithCursor.text);
  console.log(textWithCursor.cursorPosition);
})();
console.log("|-------------|");

console.log("Test create card with cursor");
console.log("|-------------|");
(() => {
  const textWithCursor = session.createCard("Spanish", {
    text: "This is a test which includes a blank here: _____________________________",
    cursorPosition: { x: 44, y: 0 },
  });
  console.log(textWithCursor.text);
  console.log(textWithCursor.cursorPosition);
})();
console.log("|-------------|");

console.log("Test create card with cursor");
console.log("|-------------|");
(() => {
  const textWithCursor = session.createCard("Spanish", {
    text: "_______________: This is a test which includes a blank on the first side <---",
    cursorPosition: { x: 0, y: 0 },
  });
  console.log(textWithCursor.text);
  console.log(textWithCursor.cursorPosition);
})();
console.log("|-------------|");

console.log("Test create card with cursor 2");
console.log("|-------------|");
(() => {
  const textWithCursor = session.createCard("Celsius/Fahrenheit conversion", {
    text: "176C : ____",
    cursorPosition: { x: 7, y: 0 },
  });
  console.log(textWithCursor.text);
  console.log(textWithCursor.cursorPosition);
})();
console.log("|-------------|");

console.log("Test create card with cursor 3");
console.log("|-------------|");
(() => {
  const textWithCursor = session.createCard("Solar energy", {
    text: "What was the total electricity consumption of Spain in 2018? : _______",
    cursorPosition: { x: 63, y: 0 },
  });
  console.log(textWithCursor.text);
  console.log(textWithCursor.cursorPosition);
})();
console.log("|-------------|");
