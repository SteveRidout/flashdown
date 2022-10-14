// Designed to be run directly with ts-node for now since we don't have a proper unit testing
// framework set up yet.

import * as sessionPage from "./sessionPage";

const testTextWithCursor = {
  text: "Heading\n\nThis is some test text with a blank here _______ and this is the end.",
  cursorPosition: {
    x: 40,
    y: 2,
  },
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

describe("addFrame", () => {
  test("card body text, width 20", () => {
    expect(sessionPage.addFrame(testCardBody, 30)).toStrictEqual({
      cursorPosition: undefined,
      text: `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Topic: Spanish words       ┃
┃                            ┃
┃ La puta madre: The whore   ┃
┃ mother (that's awesome!)   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
    });
  });

  test("card body text, width 30", () => {
    expect(sessionPage.addFrame(testCardBody, 30)).toStrictEqual({
      cursorPosition: undefined,
      text: `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Topic: Spanish words       ┃
┃                            ┃
┃ La puta madre: The whore   ┃
┃ mother (that's awesome!)   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
    });
  });

  test("card body text with cursor, width 30", () => {
    expect(sessionPage.addFrame(testCardBodyWithCursor, 30)).toStrictEqual({
      cursorPosition: {
        x: 17,
        y: 3,
      },
      text: `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Topic: Spanish words       ┃
┃                            ┃
┃ La puta madre: ___________ ┃
┃ _______________________    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
    });
  });
});

describe("createCard", () => {
  test("Big blank to reflow", () => {
    expect(
      sessionPage.createCard("Spanish", {
        text: "This is a test which includes a blank here: _____________________________",
        cursorPosition: { x: 44, y: 0 },
      })
    ).toStrictEqual({
      cursorPosition: {
        x: 46,
        y: 3,
      },
      text: `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Topic: Spanish                                           ┃
┃                                                          ┃
┃ This is a test which includes a blank here: ____________ ┃
┃ _________________                                        ┃
┃                                                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
    });
  });

  test("Blank on front side", () => {
    expect(
      sessionPage.createCard("Spanish", {
        text: "_______________: This is a test which includes a blank on the first side <---",
        cursorPosition: { x: 0, y: 0 },
      })
    ).toStrictEqual({
      cursorPosition: {
        x: 2,
        y: 3,
      },
      text: `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Topic: Spanish                                           ┃
┃                                                          ┃
┃ _______________: This is a test which includes a blank   ┃
┃ on the first side <---                                   ┃
┃                                                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
    });
  });

  test("With cursor 2", () => {
    expect(
      sessionPage.createCard("Celsius/Fahrenheit conversion", {
        text: "176C : ____",
        cursorPosition: { x: 7, y: 0 },
      })
    ).toStrictEqual({
      cursorPosition: {
        x: 9,
        y: 3,
      },
      text: `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Topic: Celsius/Fahrenheit conversion                     ┃
┃                                                          ┃
┃ 176C : ____                                              ┃
┃                                                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
    });
  });

  test("With cursor 3", () => {
    expect(
      sessionPage.createCard("Solar energy", {
        text: "What was the total electricity consumption of Spain in 2018? : _______",
        cursorPosition: { x: 63, y: 0 },
      })
    ).toStrictEqual({
      cursorPosition: {
        x: 10,
        y: 4,
      },
      text: `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Topic: Solar energy                                      ┃
┃                                                          ┃
┃ What was the total electricity consumption of Spain in   ┃
┃ 2018? : _______                                          ┃
┃                                                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
    });
  });
});
