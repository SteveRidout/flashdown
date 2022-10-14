import chalk from "chalk";

import config from "../config";
import * as renderUtils from "./renderUtils";
import { TextWithCursor } from "../types";

export const render = (message: string[]): TextWithCursor => {
  return {
    lines: [
      ...renderUtils.reflowText({ lines: message }, config.maxColumnWidth)
        .lines,
      "",
      "",
      chalk.greenBright("  Hit SPACE to go back"),
    ],
  };
};
