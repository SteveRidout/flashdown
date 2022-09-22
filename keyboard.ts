import readline from "readline";

readline.emitKeypressEvents(process.stdin);

process.stdin.setRawMode(true);
process.stdin.on("keypress", (str, key) => {
  // XXX Ideally we wouldn't need to do this...
  if (key.name === "c" && key.ctrl) {
    process.exit();
  }

  for (const handlerId of Object.keys(handlers)) {
    const { stopListening } = handlers[handlerId](key.name);
    if (stopListening) {
      delete handlers[handlerId];
    }
  }
});

/** This will be incremented for each new callback that we add */
let nextHandlerId = 0;
const handlers: { [id: string]: (key: string) => { stopListening: boolean } } =
  {};

export const getKeypress = (permittedKeys: string[]): Promise<string> =>
  new Promise<string>(
    (resolve: (value: string) => void, reject: (reason: string) => void) => {
      handlers[nextHandlerId] = (keyName: string) => {
        if (permittedKeys.includes(keyName)) {
          resolve(keyName);
          return { stopListening: true };
        } else {
          return { stopListening: false };
        }
      };
      nextHandlerId++;
    }
  );
