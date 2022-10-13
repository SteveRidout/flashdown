import { describe, expect, test } from "@jest/globals";

import * as spacedRepetition from "./spacedRepetition";

const minutesSinceEpoch = (date: Date) =>
  Math.floor(date.getTime() / (60 * 1000));

/** Time in minutes */
const DAY = 24 * 60;

describe("getSpacedRepetitionInfo", () => {
  test("1st interval, score 3", () => {
    expect(
      spacedRepetition.getSpacedRepetitionInfo([
        {
          practiceTime: minutesSinceEpoch(new Date(2022, 10, 7)),
          score: 3,
        },
      ])
    ).toStrictEqual({
      nextPracticeTime: minutesSinceEpoch(new Date(2022, 10, 8)),
      previousInterval: undefined,
      previousScore: 3,
      easinessFactor: 2.5,
    });
  });

  test("1st interval, score 4", () => {
    expect(
      spacedRepetition.getSpacedRepetitionInfo([
        {
          practiceTime: minutesSinceEpoch(new Date(2022, 10, 7)),
          score: 4,
        },
      ])
    ).toStrictEqual({
      nextPracticeTime: minutesSinceEpoch(new Date(2022, 10, 9)),
      previousInterval: undefined,
      previousScore: 4,
      easinessFactor: 2.6,
    });
  });

  test("2nd practice", () => {
    expect(
      spacedRepetition.getSpacedRepetitionInfo([
        {
          practiceTime: minutesSinceEpoch(new Date(2022, 10, 7)),
          score: 4,
        },
        {
          practiceTime: minutesSinceEpoch(new Date(2022, 10, 10)),
          score: 3,
        },
      ])
    ).toStrictEqual({
      nextPracticeTime: minutesSinceEpoch(new Date(2022, 10, 10)) + 7.8 * DAY,
      previousInterval: 3 * DAY,
      previousScore: 3,
      easinessFactor: 2.6,
    });
  });

  test("2nd practice (long after)", () => {
    expect(
      spacedRepetition.getSpacedRepetitionInfo([
        {
          practiceTime: minutesSinceEpoch(new Date(2022, 10, 7)),
          score: 4,
        },
        {
          practiceTime: minutesSinceEpoch(new Date(2022, 10, 27)),
          score: 3,
        },
      ])
    ).toStrictEqual({
      nextPracticeTime: minutesSinceEpoch(new Date(2022, 10, 27)) + 52 * DAY,
      previousInterval: 20 * DAY,
      previousScore: 3,
      easinessFactor: 2.6,
    });
  });

  test("3rd practice fail", () => {
    expect(
      spacedRepetition.getSpacedRepetitionInfo([
        {
          practiceTime: minutesSinceEpoch(new Date(2022, 10, 7)),
          score: 4,
        },
        {
          practiceTime: minutesSinceEpoch(new Date(2022, 10, 10)),
          score: 3,
        },
        {
          practiceTime: minutesSinceEpoch(new Date(2022, 10, 16)),
          score: 1,
        },
      ])
    ).toStrictEqual({
      nextPracticeTime: minutesSinceEpoch(new Date(2022, 10, 16)) + 6 * 60,
      previousInterval: 6 * DAY,
      previousScore: 1,
      easinessFactor: 1.8,
    });
  });

  test("4th practice succeed", () => {
    expect(
      spacedRepetition.getSpacedRepetitionInfo([
        {
          practiceTime: minutesSinceEpoch(new Date(2022, 10, 7)),
          score: 4,
        },
        {
          practiceTime: minutesSinceEpoch(new Date(2022, 10, 10)),
          score: 3,
        },
        {
          practiceTime: minutesSinceEpoch(new Date(2022, 10, 16)),
          score: 1,
        },
        {
          practiceTime: minutesSinceEpoch(new Date(2022, 10, 16)) + 0.5 * DAY,
          score: 3,
        },
      ])
    ).toStrictEqual({
      nextPracticeTime:
        minutesSinceEpoch(new Date(2022, 10, 16)) + 0.5 * DAY + 1.8 * 0.5 * DAY,
      previousInterval: 0.5 * DAY,
      previousScore: 3,
      easinessFactor: 1.8,
    });
  });
});
