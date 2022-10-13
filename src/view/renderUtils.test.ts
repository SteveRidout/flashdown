// Designed to be run directly with ts-node for now since we don't have a proper unit testing
// framework set up yet.

import * as renderUtils from "./renderUtils";

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

describe("splitIntoLines", () => {
  test("without cursor", () => {
    expect(renderUtils.splitIntoLines(testTextWithoutCursor)).toStrictEqual([
      { text: "Heading" },
      { text: "" },
      { text: "This is some test text without a blank and a cursor." },
    ]);
  });

  test("with cursor", () => {
    expect(renderUtils.splitIntoLines(testTextWithCursor)).toStrictEqual([
      { text: "Heading" },
      { text: "" },
      {
        cursorPosition: { x: 40, y: 0 },
        text: "This is some test text with a blank here _______ and this is the end.",
      },
    ]);
  });
});

describe("reflowText", () => {
  test("width 30", () => {
    expect(renderUtils.reflowText(testTextWithoutCursor, 30)).toStrictEqual({
      cursorPosition: undefined,
      text: `Heading

This is some test text without
a blank and a cursor.`,
    });
  });

  test("width 20", () => {
    expect(renderUtils.reflowText(testTextWithoutCursor, 20)).toStrictEqual({
      cursorPosition: undefined,
      text: `Heading

This is some test
text without a blank
and a cursor.`,
    });
  });

  test("width 30 with cursor position", () => {
    expect(renderUtils.reflowText(testTextWithCursor, 30)).toStrictEqual({
      cursorPosition: { x: 10, y: 3 },
      text: `Heading

This is some test text with a
blank here _______ and this is
the end.`,
    });
  });

  test("width 15 with cursor position", () => {
    expect(renderUtils.reflowText(testTextWithCursor, 15)).toStrictEqual({
      cursorPosition: { x: 12, y: 4 },
      text: `Heading

This is some
test text with
a blank here __
_____ and this
is the end.`,
    });
  });

  test("width 15 with cursor position", () => {
    expect(
      renderUtils.reflowText(
        {
          text: "What was the total electricity consumption of Spain in 2018? : _______",
          cursorPosition: { x: 63, y: 0 },
        },
        50
      )
    ).toStrictEqual({
      cursorPosition: { x: 17, y: 1 },
      text: `What was the total electricity consumption of
Spain in 2018? : _______`,
    });
  });
});
