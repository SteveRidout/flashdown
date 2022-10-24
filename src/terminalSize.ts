import * as config from "./config";

export const getWidth = () =>
  Math.min(config.get().maxColumnWidth, process.stdout.columns);
