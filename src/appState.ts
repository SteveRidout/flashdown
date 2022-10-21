import { AppState } from "./types";
import * as view from "./view/index";

// All app state stored here. Every time this is updated the view is rerendered.
// (A bit like the architecture used by Elm and Redux)
let appState: AppState;

export const setState = (newAppState: AppState) => {
  appState = newAppState;

  // Trigger view update
  view.updateView(appState);
};

export const get = () => appState;
