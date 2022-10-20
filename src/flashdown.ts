/** This module is the main entry point for the Flashdown app */

import * as _ from "lodash";
import { program } from "commander";

import { FilesStatus } from "./types";
import * as debug from "./debug";
import * as ansiEscapes from "./ansiEscapes";
import * as appState from "./appState";
import * as flashdownFilesDAL from "./dal/flashdownFilesDAL";
import * as onboardingPageController from "./onboardingPageController";
import * as actions from "./actions";
import * as config from "./config";
import * as view from "./view/index";

program.option("--file <filename>");
program.option("--test", "Don't write practice records");
program.parse(process.argv);

config.setOptions(program.opts());

debug.log("Start app");
debug.log("---------");

const handleFilesUpdated = async (status: FilesStatus) => {
  if (status === "user-specified-file-not-found") {
    console.error(`Error: File not found: ${config.get().file}`);
    console.error();
    process.exit();
  }

  if (flashdownFilesDAL.getFileNames().length === 0) {
    await onboardingPageController.run();
    flashdownFilesDAL.readAndWatchFlashdownFileNamesInHomeDir(
      handleFilesUpdated
    );
    actions.showHome();
    return;
  }

  if (appState.get() === undefined || appState.get().page.name === "home") {
    actions.showHome();
  }
};

flashdownFilesDAL.init(config.get().file, handleFilesUpdated);

process.stdout.on("resize", () => {
  view.updateView(appState.get(), true);
});
