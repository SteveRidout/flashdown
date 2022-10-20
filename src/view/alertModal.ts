import * as _ from "lodash";
import chalk from "chalk";

import config from "../config";
import * as renderUtils from "./renderUtils";
import { TerminalViewModel } from "../types";
import * as appState from "../appState";

export const render = (message: string[]): TerminalViewModel => {
  const indent = 2;

  return {
    textWithCursor: {
      lines: [
        "",
        ...renderUtils.indent(
          renderUtils.reflowText(
            { lines: message },
            config.maxColumnWidth - indent
          ),
          indent
        ).lines,
        "",
        "",
        chalk.cyanBright(`${_.repeat(" ", indent)}Hit SPACE to go back`),
      ],
    },
    animations: [],

    keyPressHandler: (_str, key) => {
      if (!["space", "return"].includes(key.name)) {
        return;
      }
      appState.setState({ ...appState.get(), modalMessage: undefined });
    },
  };
};
