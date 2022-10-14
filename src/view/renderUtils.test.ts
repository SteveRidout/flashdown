import { TextWithCursor } from "../types";
import * as renderUtils from "./renderUtils";

const testTextWithCursor: TextWithCursor = {
  lines: [
    "Heading",
    "",
    "This is some test text with a blank here _______ and this is the end.",
  ],
  cursorPosition: {
    x: 40,
    y: 2,
  },
};

const testTextWithoutCursor: TextWithCursor = {
  lines: [
    "Heading",
    "",
    "This is some test text without a blank and a cursor.",
  ],
};

describe("reflowText", () => {
  test("width 30", () => {
    expect(renderUtils.reflowText(testTextWithoutCursor, 30)).toStrictEqual({
      cursorPosition: undefined,
      lines: [
        "Heading",
        "",
        "This is some test text without",
        "a blank and a cursor.",
      ],
    });
  });

  test("width 20", () => {
    expect(renderUtils.reflowText(testTextWithoutCursor, 20)).toStrictEqual({
      cursorPosition: undefined,
      lines: [
        "Heading",
        "",
        "This is some test",
        "text without a blank",
        "and a cursor.",
      ],
    });
  });

  test("width 30 with cursor position", () => {
    expect(renderUtils.reflowText(testTextWithCursor, 30)).toStrictEqual({
      cursorPosition: { x: 10, y: 3 },
      lines: [
        "Heading",
        "",
        "This is some test text with a",
        "blank here _______ and this is",
        "the end.",
      ],
    });
  });

  test("width 15 with cursor position", () => {
    expect(renderUtils.reflowText(testTextWithCursor, 15)).toStrictEqual({
      cursorPosition: { x: 12, y: 4 },
      lines: [
        "Heading",
        "",
        "This is some",
        "test text with",
        "a blank here __",
        "_____ and this",
        "is the end.",
      ],
    });
  });

  test("width 15 with cursor position", () => {
    expect(
      renderUtils.reflowText(
        {
          lines: [
            "What was the total electricity consumption of Spain in 2018? : _______",
          ],
          cursorPosition: { x: 63, y: 0 },
        },
        50
      )
    ).toStrictEqual({
      cursorPosition: { x: 17, y: 1 },
      lines: [
        "What was the total electricity consumption of",
        "Spain in 2018? : _______",
      ],
    });
  });
});
