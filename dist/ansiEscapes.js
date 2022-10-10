"use strict";
// ANSI codes reference: https://gist.github.com/fnky/458719343aabd01cfb17a3a4f7296797
Object.defineProperty(exports, "__esModule", { value: true });
exports.link = exports.disableAlternativeBuffer = exports.enableAlternativeBuffer = exports.hideCursor = exports.showCursor = exports.moveCursorToNextLine = exports.moveCursorTo = void 0;
// XXX Maybe swap this for ansi-escapes module?
var ESC = "\u001B";
var OSC = "\u001B]";
var BEL = "\u0007";
var SEP = ";";
var moveCursorTo = function (line, column) {
    return "".concat(ESC, "|").concat(line, ";").concat(column, "H");
};
exports.moveCursorTo = moveCursorTo;
exports.moveCursorToNextLine = "".concat(ESC, "[1E");
exports.showCursor = "".concat(ESC, "[?25h");
exports.hideCursor = "".concat(ESC, "[?25l");
exports.enableAlternativeBuffer = "".concat(ESC, "[?1049h");
exports.disableAlternativeBuffer = "".concat(ESC, "[?1049l");
var link = function (text, url) {
    return [OSC, "8", SEP, SEP, url, BEL, text, OSC, "8", SEP, SEP, BEL].join("");
};
exports.link = link;
//# sourceMappingURL=ansiEscapes.js.map