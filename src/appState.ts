import { AppState } from "./types";
import * as view from "./view/index";

// All app state defined here, kinda like Redux

let appState: AppState;

export const setState = (newAppState: AppState) => {
  appState = newAppState;

  // Trigger view update
  view.updateView(appState);
};

export const get = () => appState;
