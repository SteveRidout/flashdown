import * as appState from "./appState";
import * as keyboard from "./keyboard";
import * as flashdownFilesDAL from "./dal/flashdownFilesDAL";

export const run = async () => {
  appState.setState({
    ...appState.get(),
    page: { name: "onboarding" },
  });
  await keyboard.readKeypress(["enter", "space"]);

  // Copy example file to user's home directory
  flashdownFilesDAL.copyOnboardingExample();
};
