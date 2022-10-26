import { AppState } from "./types";
import * as view from "./view/index";

// All app state stored here. Every time this is updated the view is rerendered.
// (A bit like the architecture used by Elm and Redux)
let appState: AppState;

let updateView: (appState: AppState) => void;

export const setUpdateViewFunction = (
  newUpdateViewFunction: typeof updateView
) => {
  updateView = newUpdateViewFunction;
};

export const setState = (newAppState: AppState) => {
  appState = newAppState;

  // Trigger view update
  updateView?.(appState);
};

export const get = () => appState;
