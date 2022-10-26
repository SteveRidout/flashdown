/** This module is the main entry point for the Flashdown app */

import * as _ from "lodash";
import { program } from "commander";

import { FilesStatus } from "./types";
import * as debug from "./debug";
import * as appState from "./appState";
import * as flashdownFilesDAL from "./dal/flashdownFilesDAL";
import * as actions from "./actions";
import * as config from "./config";
import * as view from "./view/index";

program.option("--file <filename>");
program.option("--test", "Don't write practice records");
program.option("--stats", "Show spaced repetition stats during session");
program.parse(process.argv);

config.setOptions(program.opts());

appState.setUpdateViewFunction(view.updateView);

debug.log("Start app");
debug.log("---------");

const showOrUpdateHomeIfAppropriate = () => {
  if (
    appState.get() === undefined ||
    ["home", "onboarding"].includes(appState.get().page.name)
  ) {
    actions.showHome();
  }
};

const handleFilesUpdated = async (status: FilesStatus) => {
  if (status === "user-specified-file-not-found") {
    console.error(`Error: File not found: ${config.get().file}`);
    console.error();
    process.exit();
  }

  if (flashdownFilesDAL.getFileNames().length === 0) {
    appState.setState({
      ...appState.get(),
      page: { name: "onboarding" },
    });
    return;
  }

  showOrUpdateHomeIfAppropriate();
};

flashdownFilesDAL.init(config.get().file, handleFilesUpdated);

process.stdout.on("resize", () => {
  view.updateView(appState.get(), true);
});

// Update homepage every hour for users who leave the app open a long time
setInterval(() => {
  showOrUpdateHomeIfAppropriate();
}, 60 * 60 * 1000);
