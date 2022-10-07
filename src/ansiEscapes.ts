// ANSI codes reference: https://gist.github.com/fnky/458719343aabd01cfb17a3a4f7296797

// XXX Maybe swap this for ansi-escapes module?

const ESC = "\u001B";
const OSC = "\u001B]";
const BEL = "\u0007";
const SEP = ";";

export const moveCursorTo = (line: number, column: number) => {
  return `${ESC}|${line};${column}H`;
};

export const moveCursorToNextLine = `${ESC}[1E`;

export const showCursor = `${ESC}[?25h`;
export const hideCursor = `${ESC}[?25l`;

export const enableAlternativeBuffer = `${ESC}[?1049h`;
export const disableAlternativeBuffer = `${ESC}[?1049l`;

export const link = (text: string, url: string) =>
  [OSC, "8", SEP, SEP, url, BEL, text, OSC, "8", SEP, SEP, BEL].join("");
