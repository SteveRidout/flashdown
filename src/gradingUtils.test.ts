import { describe, expect, test } from "@jest/globals";

import { editDistance } from "./gradingUtils";

describe("gradingUtils", () => {
  test("editDistance almost", () => {
    expect(editDistance("hello", "he1lo")).toEqual("almost");
    expect(editDistance("hello", "helo")).toEqual("almost");
    expect(editDistance("hello", "ello")).toEqual("almost");
    expect(editDistance("hello", "ehllo")).toEqual("almost");
  });

  test("editDistance exact", () => {
    expect(editDistance("", "")).toEqual("exact");
    expect(editDistance("a", "a")).toEqual("exact");
    expect(editDistance("hello", "hello")).toEqual("exact");
  });

  test("editDistance different", () => {
    expect(editDistance("hello", "hello what")).toEqual("different");
    expect(editDistance("hello", "lloeh")).toEqual("different");
  });
});
