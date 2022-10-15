import * as _ from "lodash";
import chalk from "chalk";
// import * as readline from "readline";

const columns = 30;

const render = (progress: number) => {
  process.stdout.write(
    _.repeat(chalk.bgWhite(chalk.white("█")), progress) +
      _.repeat(chalk.gray("."), columns - progress)
  );
};

const renderShine = (progress: number) => {
  const text = (() => {
    switch (progress) {
      case 0:
        return _.repeat(chalk.bgGray(chalk.yellow("░")), columns);
      case 1:
        return _.repeat(chalk.bgYellow(chalk.yellowBright("░")), columns);
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
        return _.repeat(chalk.bgYellowBright(chalk.yellowBright(" ")), columns);
      case 9:
        return (
          _.repeat(chalk.bgYellowBright(chalk.whiteBright("░")), 1) +
          _.repeat(chalk.bgWhiteBright(chalk.whiteBright("░")), 3) +
          _.repeat(chalk.bgYellowBright(chalk.whiteBright("░")), 1) +
          _.repeat(chalk.bgYellowBright(chalk.yellowBright(" ")), columns - 5)
        );
      case 10:
        return (
          _.repeat(chalk.bgYellowBright(chalk.yellowBright(" ")), 10) +
          _.repeat(chalk.bgYellowBright(chalk.whiteBright("░")), 1) +
          _.repeat(chalk.bgWhiteBright(chalk.whiteBright("░")), 3) +
          _.repeat(chalk.bgYellowBright(chalk.whiteBright("░")), 1) +
          _.repeat(chalk.bgYellowBright(chalk.yellowBright(" ")), columns - 15)
        );
      case 11:
        return (
          _.repeat(chalk.bgYellowBright(chalk.yellowBright(" ")), 20) +
          _.repeat(chalk.bgYellowBright(chalk.whiteBright("░")), 1) +
          _.repeat(chalk.bgWhiteBright(chalk.whiteBright("░")), 3) +
          _.repeat(chalk.bgYellowBright(chalk.whiteBright("░")), 1) +
          _.repeat(chalk.bgYellowBright(chalk.yellowBright(" ")), columns - 25)
        );
      default:
        return _.repeat(chalk.bgYellowBright(chalk.yellowBright("█")), columns);
    }
  })();

  process.stdout.write(text);
};

const sleep = (duration: number) =>
  new Promise((resolve) => setTimeout(resolve, duration));

const run = async () => {
  console.log();

  for (let progress = 0; progress <= columns; progress++) {
    process.stdout.cursorTo(0);

    process.stdout.write("|");
    render(progress);
    process.stdout.write("|");
    process.stdout.write(` (${progress} / ${columns})`);
    await sleep(1000 / 10);
  }

  for (let progress = 0; progress <= columns; progress++) {
    process.stdout.cursorTo(0);

    process.stdout.write("|");
    renderShine(progress);
    process.stdout.write("|");
    process.stdout.write(` (${columns} / ${columns})`);
    await sleep(1000 / 18);
  }

  console.log();
};

run();
