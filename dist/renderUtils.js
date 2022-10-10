"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.repeat = exports.reflowText = exports.splitIntoLines = exports.joinLines = void 0;
/**
 * Joins the given lines inserting a newline between each one. This will throw an error if more
 * than one line contains a cursor position.
 */
var joinLines = function (lines) {
    var y = 0;
    var cursorPosition = undefined;
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        if (line.cursorPosition) {
            if (cursorPosition) {
                throw Error("Two separate lines both contain cursor positions");
            }
            cursorPosition = {
                x: line.cursorPosition.x,
                y: y + line.cursorPosition.y,
            };
        }
        y += line.text.split("\n").length;
    }
    return {
        text: lines.map(function (_a) {
            var text = _a.text;
            return text;
        }).join("\n"),
        cursorPosition: cursorPosition,
    };
};
exports.joinLines = joinLines;
var splitIntoLines = function (textWithCursor) {
    var lines = textWithCursor.text
        .split("\n")
        .map(function (text) { return ({ text: text }); });
    if (textWithCursor.cursorPosition) {
        // Iterate through lines until we reach
        var line = lines[textWithCursor.cursorPosition.y];
        lines[textWithCursor.cursorPosition.y] = {
            text: line.text,
            cursorPosition: {
                x: textWithCursor.cursorPosition.x,
                y: 0,
            },
        };
    }
    return lines;
};
exports.splitIntoLines = splitIntoLines;
var reflowText = function (textWithCursor, columns) {
    var _a;
    var lines = (0, exports.splitIntoLines)(textWithCursor);
    var intermediateLines = [];
    for (var _i = 0, lines_2 = lines; _i < lines_2.length; _i++) {
        var line = lines_2[_i];
        var currentY = 0;
        var currentX = 0;
        var text = line.text;
        var cursorPositionX = (_a = line.cursorPosition) === null || _a === void 0 ? void 0 : _a.x;
        var newLineCursorPosition = void 0;
        while (text.length - currentX > columns) {
            var reflowX = currentX + columns;
            if (text[reflowX] === "_") {
                // Just split underlines
                var newLine = "\n";
                text =
                    text.substring(0, currentX + columns) +
                        newLine +
                        text.substring(currentX + columns);
                if (cursorPositionX !== undefined &&
                    cursorPositionX >= currentX &&
                    cursorPositionX < currentX + columns) {
                    newLineCursorPosition = {
                        y: currentY,
                        x: cursorPositionX - currentX,
                    };
                    cursorPositionX = undefined;
                }
                currentX += columns + newLine.length;
                currentY += 1;
            }
            else {
                while (text[reflowX] !== " " && reflowX > currentX) {
                    reflowX -= 1;
                }
                if (reflowX === currentX) {
                    // Uh-oh, we couldn't reflow since there was no space character, so split the word with a
                    // hyphen
                    var hyphenAndNewline = "-\n";
                    text =
                        text.substring(0, currentX + columns) +
                            hyphenAndNewline +
                            text.substring(currentX + columns);
                    if (cursorPositionX !== undefined &&
                        cursorPositionX >= currentX &&
                        cursorPositionX < currentX + columns) {
                        newLineCursorPosition = {
                            y: currentY,
                            x: cursorPositionX - currentX,
                        };
                        cursorPositionX = undefined;
                    }
                    if (cursorPositionX && cursorPositionX > currentX + columns) {
                        cursorPositionX += hyphenAndNewline.length;
                    }
                    currentX += columns + hyphenAndNewline.length;
                    currentY += 1;
                }
                else {
                    // Replace the space with a newline
                    text =
                        text.substring(0, reflowX) + "\n" + text.substring(reflowX + 1);
                    if (cursorPositionX !== undefined &&
                        cursorPositionX >= currentX &&
                        cursorPositionX < reflowX) {
                        newLineCursorPosition = {
                            y: currentY,
                            x: cursorPositionX - currentX,
                        };
                        cursorPositionX = undefined;
                    }
                    currentX = reflowX + 1;
                    currentY += 1;
                }
            }
        }
        // In case the cursor is on the last line (commonly this is the only line)
        if (cursorPositionX !== undefined &&
            cursorPositionX >= currentX &&
            cursorPositionX < currentX + columns) {
            newLineCursorPosition = {
                y: currentY,
                x: cursorPositionX - currentX,
            };
            cursorPositionX = undefined;
        }
        // XXX Add cursor position
        intermediateLines.push({ text: text, cursorPosition: newLineCursorPosition });
    }
    return (0, exports.joinLines)(intermediateLines);
};
exports.reflowText = reflowText;
var repeat = function (character, size) {
    return size === 0 ? "" : __spreadArray([], Array(size), true).map(function () { return character; }).join("");
};
exports.repeat = repeat;
//# sourceMappingURL=renderUtils.js.map