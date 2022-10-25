const coreConfig = {
  /** Ideal number of cards per session */
  targetCardsPerSession: 10,

  /** If number of characters in answer is less than this, use typing mode */
  typingThreshold: 20,

  /** The maximum number of columns to use when rendering the UI */
  maxColumnWidth: 78,
};

interface CLIOptions {
  file?: string;
  test?: boolean;
  stats?: boolean;
}

let config: typeof coreConfig & CLIOptions = coreConfig;

export const setOptions = (options: CLIOptions) => {
  config = { ...config, ...options };
};

export const get = () => config;
