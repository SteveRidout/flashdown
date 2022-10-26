import * as config from "./config";

import * as utils from "./utils";

export const getWidth = () =>
  utils.inUnitTest()
    ? config.get().maxColumnWidth
    : Math.min(
        config.get().maxColumnWidth,
        // Remove 1 to add a right hand margin
        process.stdout.columns - 1
      );
