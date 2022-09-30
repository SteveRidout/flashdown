import readline from "readline";

readline.emitKeypressEvents(process.stdin);

process.stdin.setRawMode(true);
process.stdin.on("keypress", (_str, key) => {
  // XXX Ideally we wouldn't need to do this...
  if (key.name === "c" && key.ctrl) {
    process.exit();
  }

  for (const handlerId of Object.keys(handlers)) {
    const { handled } = handlers[handlerId](key.name);
    if (handled) {
      delete handlers[handlerId];

      // Reading stdin only so that these characters don't appear after the text input cursor after
      // we call readline.question() later.
      // XXX Not 100% sure this is the correct place to call this. Is it guaranteed that stdin will
      // contain the data generated from the current keypress at this point?
      const latestInput = process.stdin.read()?.toString();
      if (latestInput === undefined || latestInput.length === 0) {
        // XXX This is very hacky
        setTimeout(() => {
          const latestInput = process.stdin.read()?.toString();
        }, 100);
      }
    }
  }
});

/** This will be incremented for each new callback that we add */
let nextHandlerId = 0;
const handlers: { [id: string]: (key: string) => { handled: boolean } } = {};

export const getKeypress = (permittedKeys: string[]): Promise<string> =>
  new Promise<string>(
    (resolve: (value: string) => void, reject: (reason: string) => void) => {
      handlers[nextHandlerId] = (keyName: string) => {
        if (permittedKeys.includes(keyName)) {
          resolve(keyName);
          return { handled: true };
        } else {
          return { handled: false };
        }
      };
      nextHandlerId++;
    }
  );
