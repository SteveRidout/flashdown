import chalk from "chalk";

import * as keyboard from "./keyboard";
import config from "./config";
import * as renderUtils from "./renderUtils";

export const show = async (message: string) => {
  console.clear();
  // XXX Consider indenting the whole of this instead of just the first line.
  console.log(
    renderUtils.reflowText({ text: "  " + message }, config.maxColumnWidth).text
  );
  console.log();
  console.log();
  console.log(chalk.greenBright("  Hit SPACE to go back"));
  await keyboard.readKeypress(["space", "return"]);
};
