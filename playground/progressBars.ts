import chalk from "chalk";
import * as ansiEscapes from "../src/ansiEscapes";

import * as renderUtils from "../src/renderUtils";
import config from "../src/config";

const renderProgressBar = (position: number, total: number) => {
  const suffix = ` (${position} / ${total})`;
  const barWidth = config.maxColumnWidth - suffix.length;
  const screenPosition = Math.round((barWidth * position) / total);

  return `${renderUtils.repeat("█", screenPosition)}${renderUtils.repeat(
    chalk.grey("░"),
    barWidth - screenPosition
  )}${suffix}`;
};

const progressStates: number[][] = [
  [0, 10],
  [2, 10],
  [8, 10],
  [10, 10],
  [0, 5],
  [3, 5],
  [5, 5],
];

console.log(renderUtils.repeat("-", config.maxColumnWidth));

for (const [position, total] of progressStates) {
  console.log();
  console.log(renderProgressBar(position, total));
}

console.log(renderUtils.repeat("-", config.maxColumnWidth));

console.log();

console.log(
  ansiEscapes.link("https://steveridout.com", "https://steveridout.com")
);
