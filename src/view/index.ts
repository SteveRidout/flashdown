import * as _ from "lodash";

import { AppState } from "../types";
import * as homePage from "./homePage";
import * as sessionPage from "./sessionPage";

// Would be nice to do clever diffing here so that we only need to update what actually changed like
// React does, but for now it simply re-renders everything.

export const updateView = (appState: AppState) => {
  switch (appState.page.name) {
    case "home":
      homePage.render(appState.homePageData, appState.fileName, appState.page);
      break;

    case "session":
      sessionPage.render(appState.page);
      break;

    default:
      console.clear();
      console.log(JSON.stringify(appState));
  }
};
