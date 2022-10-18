import { TextWithCursor } from "../types";
import * as sessionPage from "./sessionPage";

const testCardBody: TextWithCursor = {
  lines: [
    "Topic: Spanish phrases",
    "",
    "Es la leche: It's the milk (it's awesome!)",
  ],
};

const testCardBodyWithCursor = {
  lines: [
    "Topic: Spanish phrases",
    "",
    "Es la leche: _____________________________",
  ],
  cursorPosition: {
    x: 13,
    y: 2,
  },
};

describe("addFrame", () => {
  test("card body text, width 20", () => {
    expect(sessionPage.addFrame(testCardBody, 20)).toStrictEqual({
      cursorPosition: undefined,
      lines: [
        "┏━━━━━━━━━━━━━━━━━━┓",
        "┃ Topic: Spanish   ┃",
        "┃ phrases          ┃",
        "┃                  ┃",
        "┃ Es la leche:     ┃",
        "┃ It's the milk    ┃",
        "┃ (it's awesome!)  ┃",
        "┗━━━━━━━━━━━━━━━━━━┛",
      ],
    });
  });

  test("card body text, width 30", () => {
    expect(sessionPage.addFrame(testCardBody, 30)).toStrictEqual({
      cursorPosition: undefined,
      lines: [
        "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓",
        "┃ Topic: Spanish phrases     ┃",
        "┃                            ┃",
        "┃ Es la leche: It's the milk ┃",
        "┃ (it's awesome!)            ┃",
        "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛",
      ],
    });
  });

  test("card body text with cursor, width 30", () => {
    expect(sessionPage.addFrame(testCardBodyWithCursor, 30)).toStrictEqual({
      cursorPosition: {
        x: 15,
        y: 3,
      },
      lines: [
        "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓",
        "┃ Topic: Spanish phrases     ┃",
        "┃                            ┃",
        "┃ Es la leche: _____________ ┃",
        "┃ ________________           ┃",
        "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛",
      ],
    });
  });
});

describe("createCard", () => {
  test("Big blank to reflow", () => {
    expect(
      sessionPage.createCard("Spanish", {
        lines: [
          "This is a test which includes a blank here: _____________________________",
        ],
        cursorPosition: { x: 44, y: 0 },
      })
    ).toStrictEqual({
      cursorPosition: {
        x: 46,
        y: 3,
      },
      lines: [
        "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓",
        "┃ Topic: Spanish                                                               ┃",
        "┃                                                                              ┃",
        "┃ This is a test which includes a blank here: _____________________________    ┃",
        "┃                                                                              ┃",
        "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛",
      ],
    });
  });

  test("Blank on front side", () => {
    expect(
      sessionPage.createCard("Spanish", {
        lines: [
          "_______________: This is a test which includes a blank on the first side <---",
        ],
        cursorPosition: { x: 0, y: 0 },
      })
    ).toStrictEqual({
      cursorPosition: {
        x: 2,
        y: 3,
      },
      lines: [
        "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓",
        "┃ Topic: Spanish                                                               ┃",
        "┃                                                                              ┃",
        "┃ _______________: This is a test which includes a blank on the first side     ┃",
        "┃ <---                                                                         ┃",
        "┃                                                                              ┃",
        "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛",
      ],
    });
  });

  test("With cursor 2", () => {
    expect(
      sessionPage.createCard("Celsius/Fahrenheit conversion", {
        lines: ["176C : ____"],
        cursorPosition: { x: 7, y: 0 },
      })
    ).toStrictEqual({
      cursorPosition: {
        x: 9,
        y: 3,
      },
      lines: [
        "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓",
        "┃ Topic: Celsius/Fahrenheit conversion                                         ┃",
        "┃                                                                              ┃",
        "┃ 176C : ____                                                                  ┃",
        "┃                                                                              ┃",
        "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛",
      ],
    });
  });

  test("With cursor 3", () => {
    expect(
      sessionPage.createCard("Solar energy", {
        lines: [
          "What was the total electricity consumption of Spain in 2018? : _______",
        ],
        cursorPosition: { x: 63, y: 0 },
      })
    ).toStrictEqual({
      cursorPosition: {
        x: 65,
        y: 3,
      },
      lines: [
        "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓",
        "┃ Topic: Solar energy                                                          ┃",
        "┃                                                                              ┃",
        "┃ What was the total electricity consumption of Spain in 2018? : _______       ┃",
        "┃                                                                              ┃",
        "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛",
      ],
    });
  });
});
