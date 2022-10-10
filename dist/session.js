"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFrame = exports.createCard = exports.setState = exports.state = void 0;
var chalk_1 = __importDefault(require("chalk"));
var readline = __importStar(require("readline"));
var ansiEscapes = __importStar(require("./ansiEscapes"));
var renderUtils = __importStar(require("./renderUtils"));
var config_1 = __importDefault(require("./config"));
var blankText = function (input) {
    return input
        .split("")
        .map(function () { return "_"; })
        .join("");
};
var underlines = function (length) {
    var result = "";
    for (var i = 0; i < length; i++) {
        result += "_";
    }
    return result;
};
var inputText = function (input, target) {
    // Adding a space at the end in case the user types one character more
    return "".concat(input).concat(underlines(target.length - input.length), " ");
};
var previousStageType;
var renderProgressBar = function (position, total) {
    var suffix = " (".concat(position, " / ").concat(total, ")");
    var barWidth = config_1.default.maxColumnWidth - suffix.length;
    var screenPosition = Math.round((barWidth * position) / total);
    return "".concat(renderUtils.repeat("█", screenPosition)).concat(renderUtils.repeat(chalk_1.default.grey("░"), barWidth - screenPosition)).concat(suffix);
};
var render = function () {
    var upcomingCards = exports.state.upcomingCards, completedCards = exports.state.completedCards, stage = exports.state.stage;
    if (upcomingCards.length === 0) {
        return;
    }
    if (previousStageType !== stage.type) {
        console.clear();
        previousStageType = stage.type;
    }
    process.stdout.cursorTo(0, 0);
    var lines = [];
    var addLine = function (text, cursorPosition) {
        if (text === void 0) { text = ""; }
        lines.push({ text: text, cursorPosition: cursorPosition });
    };
    var totalCards = upcomingCards.length + completedCards.length;
    var numberCompleted = completedCards.length +
        ((stage.type === "finished" || stage.type === "second-side-typed") &&
            stage.score > 1
            ? 1
            : 0);
    addLine(renderProgressBar(numberCompleted, totalCards));
    var card = upcomingCards[0];
    addLine();
    addLine();
    if (card.new) {
        addLine(chalk_1.default.yellowBright("** NEW CARD **"));
    }
    switch (stage.type) {
        case "first-side-reveal":
            lines.push((0, exports.createCard)(card.sectionTitle, {
                text: "".concat(card.direction === "front-to-back"
                    ? "".concat(card.front, " : ").concat(blankText(card.back))
                    : "".concat(blankText(card.front), " : ").concat(card.back)),
            }));
            addLine();
            addLine();
            addLine(chalk_1.default.greenBright("Hit SPACE to reveal ".concat(card.direction === "front-to-back" ? "back" : "front", " of card")));
            break;
        case "first-side-type": {
            var cardContent = "";
            var cursorX = void 0;
            if (card.direction === "front-to-back") {
                cardContent = "".concat(card.front, " : ");
                cursorX = cardContent.length + stage.cursorPosition;
                cardContent += "".concat(inputText(stage.input, card.back));
            }
            else {
                cardContent = "".concat(inputText(stage.input, card.front), ": ").concat(card.back);
                cursorX = stage.cursorPosition;
            }
            var cardTextWithCursor = (0, exports.createCard)(card.sectionTitle, {
                text: cardContent,
                cursorPosition: { x: cursorX, y: 0 },
            });
            lines.push(cardTextWithCursor);
            addLine();
            addLine();
            addLine(chalk_1.default.greenBright("Type the missing answer and hit ENTER"));
            if (card.new) {
                addLine();
                addLine(chalk_1.default.greenBright("(If you don't know, just leave it blank and hit ENTER)"));
            }
            break;
        }
        case "second-side-typed":
            lines.push((0, exports.createCard)(card.sectionTitle, {
                text: "".concat(card.front, " : ").concat(card.back),
            }));
            addLine("");
            if (stage.score > 1) {
                addLine("Well done!");
            }
            else if (stage.input.trim() !== "") {
                addLine("Wrong");
            }
            addLine();
            addLine();
            addLine(chalk_1.default.greenBright("Hit SPACE to continue"));
            break;
        case "second-side-revealed":
        case "finished":
            var score = stage.type === "finished" ? stage.score : undefined;
            var text_1 = card.direction === "front-to-back"
                ? "".concat(card.front, " : ").concat(card.back)
                : "".concat(card.front, " : ").concat(card.back);
            lines.push((0, exports.createCard)(card.sectionTitle, { text: text_1 }));
            addLine();
            addLine();
            if (card.new) {
                addLine(chalk_1.default.greenBright("Did you already know this? Press the appropriate NUMBER KEY:"));
                addLine();
                addLine(chalk_1.default.redBright(!score || score === 1 ? "1) No" : ""));
                addLine(chalk_1.default.yellowBright(!score || score === 2 ? "2) Yes, kinda" : ""));
                addLine(chalk_1.default.greenBright(!score || score === 3 ? "3) Yes" : ""));
                addLine(chalk_1.default.greenBright(!score || score === 4 ? "4) Yes, very well!" : ""));
            }
            else {
                addLine(chalk_1.default.greenBright("Did you remember? Press the appropriate NUMBER KEY:"));
                addLine();
                addLine(chalk_1.default.redBright(!score || score === 1 ? "1) No" : ""));
                addLine(chalk_1.default.yellowBright(!score || score === 2 ? "2) Yes, with difficulty" : ""));
                addLine(chalk_1.default.greenBright(!score || score === 3 ? "3) Yes" : ""));
                addLine(chalk_1.default.greenBright(!score || score === 4 ? "4) Yes, easily!" : ""));
            }
            break;
    }
    var _a = renderUtils.joinLines(lines), text = _a.text, cursorPosition = _a.cursorPosition;
    console.log(text);
    process.stdout.clearScreenDown();
    if (cursorPosition) {
        readline.cursorTo(process.stdout, cursorPosition.x, cursorPosition.y);
        process.stdin.write(ansiEscapes.showCursor);
    }
    else {
        process.stdin.write(ansiEscapes.hideCursor);
    }
};
var setState = function (newState) {
    exports.state = newState;
    render();
};
exports.setState = setState;
var createCard = function (topic, body) {
    var lines = [];
    lines.push({ text: "Topic: ".concat(topic) });
    lines.push({ text: "" });
    lines.push(body);
    lines.push({ text: "" });
    return (0, exports.addFrame)(renderUtils.joinLines(lines), config_1.default.maxColumnWidth);
};
exports.createCard = createCard;
var addFrame = function (textWithCursor, width) {
    var lines = [];
    lines.push({
        text: "┏" + renderUtils.repeat("━", width - 2) + "┓",
    });
    var bodyLines = renderUtils.splitIntoLines(renderUtils.reflowText(textWithCursor, width - 4));
    for (var _i = 0, bodyLines_1 = bodyLines; _i < bodyLines_1.length; _i++) {
        var bodyLine = bodyLines_1[_i];
        lines.push({
            text: "┃ " +
                bodyLine.text +
                renderUtils.repeat(" ", width - bodyLine.text.length - 4) +
                " ┃",
            cursorPosition: bodyLine.cursorPosition
                ? {
                    x: bodyLine.cursorPosition.x + 2,
                    y: bodyLine.cursorPosition.y,
                }
                : undefined,
        });
    }
    lines.push({
        text: "┗" + renderUtils.repeat("━", width - 2) + "┛",
    });
    return renderUtils.joinLines(lines);
};
exports.addFrame = addFrame;
//# sourceMappingURL=session.js.map