const coreConfig = {
  /** Ideal number of cards per session */
  targetCardsPerSession: 10,

  /** If number of characters in answer is less than this, use typing mode */
  typingThreshold: 20,

  /** The maximum number of columns to use when rendering the UI */
  maxColumnWidth: 78,

  /** The amount of jitter (+/- fraction) to apply to the next interval */
  jitter: 0.1,
};

interface CLIOptions {
  file?: string;
  test?: boolean;
  stats?: boolean;
  cram?: number;
}

let config: typeof coreConfig & CLIOptions = coreConfig;

const parseCLIOptions = (rawOptions: any): CLIOptions => ({
  file: rawOptions.file,
  test: rawOptions.test,
  stats: rawOptions.stats,
  cram: parseInt(rawOptions.cram, 10),
});

export const setOptions = (options: CLIOptions) => {
  config = { ...config, ...options };
};

export const get = () => config;
