import * as config from "./config";

export const getWidth = () =>
  Math.min(
    config.get().maxColumnWidth,
    // Remove 1 to add a right hand margin
    process.stdout.columns - 1
  );
