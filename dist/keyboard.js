"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readLine = exports.readKeypress = void 0;
var readline = __importStar(require("readline"));
var ansiEscapes = __importStar(require("./ansiEscapes"));
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on("keypress", function (str, key) {
    // Allow user to exit with CTRL-C
    if (key.name === "c" && key.ctrl) {
        process.stdout.write(ansiEscapes.showCursor);
        process.stdout.write(ansiEscapes.disableAlternativeBuffer);
        process.exit();
    }
    switch (state.type) {
        case "ignore":
            return;
        case "await-keypress":
            if (state.permittedKeys.includes(key.name)) {
                state.onKeyPress(key.name);
                state = { type: "ignore" };
            }
            return;
        case "await-line": {
            var input = state.input, cursorPosition = state.cursorPosition;
            if (key.name === "backspace") {
                if (input.length > 0) {
                    input =
                        input.substring(0, cursorPosition - 1) +
                            input.substring(cursorPosition);
                    cursorPosition = Math.max(0, cursorPosition - 1);
                }
            }
            else if (key.name === "left") {
                cursorPosition = Math.max(0, cursorPosition - 1);
            }
            else if (key.name === "right") {
                cursorPosition = Math.min(input.length, cursorPosition + 1);
            }
            else if (key.name === "enter" || key.name === "return") {
                state.onLineSubmitted(input);
                state = { type: "ignore" };
                return;
            }
            else if (str && str.length > 0) {
                input =
                    input.substring(0, cursorPosition) +
                        str +
                        input.substring(cursorPosition);
                cursorPosition += str.length;
            }
            state = __assign(__assign({}, state), { input: input, cursorPosition: cursorPosition });
            state.onChange(input, cursorPosition);
            return;
        }
    }
});
var state = { type: "ignore" };
var readKeypress = function (permittedKeys) {
    return new Promise(function (resolve, reject) {
        state = {
            type: "await-keypress",
            permittedKeys: permittedKeys,
            onKeyPress: function (keyName) {
                resolve(keyName);
            },
        };
    });
};
exports.readKeypress = readKeypress;
var readLine = function (onChange) {
    return new Promise(function (resolve, reject) {
        state = {
            type: "await-line",
            input: "",
            cursorPosition: 0,
            onChange: onChange,
            onLineSubmitted: function (line) {
                resolve(line);
            },
        };
    });
};
exports.readLine = readLine;
//# sourceMappingURL=keyboard.js.map