import { describe, expect, test } from "@jest/globals";

import * as spacedRepetition from "./spacedRepetition";

const minutesSinceEpoch = (date: Date) =>
  Math.floor(date.getTime() / (60 * 1000));

describe("spacedRepetition", () => {
  test("getSpacedRepetitionInfo", () => {
    expect(
      spacedRepetition.getSpacedRepetitionInfo([
        {
          practiceTime: minutesSinceEpoch(new Date(2022, 10, 7)),
          score: 4,
        },
      ])
    ).toStrictEqual({
      nextPracticeTime: minutesSinceEpoch(new Date(2022, 10, 8)),
      previousInterval: undefined,
      previousScore: 4,
    });
  });
});
