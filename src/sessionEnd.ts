import chalk from "chalk";

import * as keyboard from "./keyboard";
import * as utils from "./utils";

const frameDuration = 1000 / 12;

const innerRender = (streakString: string) => {
  console.clear();
  console.log("Well done!");
  console.log();
  console.log(`Streak: ${streakString}`);
};

let transitionFrames = [".", "-", "'"];

export const run = async (previousStreak: number, currentStreak: number) => {
  innerRender(previousStreak.toString());

  if (previousStreak !== currentStreak) {
    await utils.sleep(1000);

    for (const frame of transitionFrames) {
      innerRender(frame);
      await utils.sleep(frameDuration);
    }

    innerRender(
      `${currentStreak.toString()} (+${currentStreak - previousStreak})`
    );
  }

  console.log();
  console.log(chalk.blue("Hit SPACE to continue"));
  await keyboard.readKeypress(["space", "return"]);
};
