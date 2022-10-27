import * as _ from "lodash";

import * as config from "../config";
import { getSpacedRepetitionInfo } from "../spacedRepetition";
import { CardStage, CardWithLearningMetrics, TextWithCursor } from "../types";
import { TextWithCursorBuilder } from "./renderUtils";

export const render = (
  card: CardWithLearningMetrics,
  stage: CardStage
): TextWithCursor => {
  const builder = new TextWithCursorBuilder();

  if (config.get().stats && !card.new && "previousInterval" in card) {
    builder.addText(["", ""]);

    const lastPracticeRecord = _.last(card.practiceRecords);
    if (lastPracticeRecord) {
      builder.addText(
        [
          "Previous practices: " + card.practiceRecords?.length,
          "Previous practice date: " +
            new Date(
              lastPracticeRecord.practiceTime * 60 * 1000
            ).toDateString(),
        ],
        "stats"
      );
    } else {
      builder.addText("Previous practices: " + 0, "stats");
    }
    builder.addText(
      [
        "Previous interval: " +
          (card.previousInterval === undefined
            ? "undefined"
            : (card.previousInterval / 60 / 24).toFixed(1) + " days"),
        "Previous score: " + card.previousScore,
        "Previous easiness: " + card.easinessFactor.toFixed(2),
      ],
      "stats"
    );

    if (stage.type === "finished" || stage.type === "second-side-typed") {
      const nextSRSInfo = getSpacedRepetitionInfo(card.practiceRecords);
      if (nextSRSInfo) {
        builder.addText(
          [
            "Next practice time: " +
              new Date(nextSRSInfo.nextPracticeTime * 60 * 1000).toDateString(),
            "Next easiness factor: " + nextSRSInfo.easinessFactor.toFixed(2),
          ],
          "stats"
        );
      } else {
        builder.addText("NO SRS INFO, bug?", "stats");
      }
    }
  }

  return builder.textWithCursor();
};
