import chalk from "chalk";

import * as keyboard from "./keyboard";
import config from "./config";
import * as renderUtils from "./view/renderUtils";

// TODO Move this to use the new state/view system
export const show = async (message: string) => {
  console.clear();
  // XXX Consider indenting the whole of this instead of just the first line.
  console.log(
    renderUtils.reflowText({ lines: ["  " + message] }, config.maxColumnWidth)
      .lines
  );
  console.log();
  console.log();
  console.log(chalk.greenBright("  Hit SPACE to go back"));
  await keyboard.readKeypress(["space", "return"]);
};
