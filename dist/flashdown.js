"use strict";
// 1. Read and parse the fd and fdr files
// 2. Prepare session
// 3. Save backup file
// 4. Iterate through challenges and update the original text file based on the user's responses
// 5. Show summary at end
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs"));
var _ = __importStar(require("lodash"));
var chalk_1 = __importDefault(require("chalk"));
var commander_1 = require("commander");
var keyboard = __importStar(require("./keyboard"));
var cardDAL = __importStar(require("./dal/cardDAL"));
var practiceRecordDAL = __importStar(require("./dal/practiceRecordDAL"));
var session = __importStar(require("./session"));
var debug = __importStar(require("./debug"));
var ansiEscapes = __importStar(require("./ansiEscapes"));
var homePageUtils = __importStar(require("./homePageUtils"));
var config_1 = __importDefault(require("./config"));
var lodash_1 = require("lodash");
var utils = __importStar(require("./utils"));
var sessionEnd = __importStar(require("./sessionEnd"));
var alertModal = __importStar(require("./alertModal"));
commander_1.program.option("--file <file>");
commander_1.program.parse(process.argv);
var options = commander_1.program.opts();
process.stdout.write(ansiEscapes.enableAlternativeBuffer);
debug.log("--------------");
debug.log("Start practice");
debug.log("--------------");
debug.log("options: " + JSON.stringify(commander_1.program.opts()));
// XXX Read this from command line args instead
var fileName = (_a = options.file) !== null && _a !== void 0 ? _a : "notes.fd";
if (!fs.existsSync(fileName) && !fileName.endsWith(".fd")) {
    // Try adding .fd to see if that works
    fileName += ".fd";
}
if (!fs.existsSync(fileName)) {
    console.log("The file \"".concat(fileName, "\" doesn't exist"));
    process.exit();
}
var normalizedCharacterMap = {
    ï: "i",
    "-": " ",
};
var normalizeAnswer = function (answer) {
    return answer
        .split("")
        .map(function (character) { var _a; return (_a = normalizedCharacterMap[character]) !== null && _a !== void 0 ? _a : character; })
        .join("")
        .trim()
        .toLowerCase();
};
var processNextCard = function () { return __awaiter(void 0, void 0, void 0, function () {
    var card, missingText, score, answer, key;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                card = session.state.upcomingCards[0];
                if (!card) {
                    throw Error("No more upcoming cards");
                }
                debug.log("Next card: " + JSON.stringify(card));
                missingText = card.direction === "front-to-back" ? card.back : card.front;
                if (!(missingText.length <= config_1.default.typingThreshold)) return [3 /*break*/, 3];
                session.setState(__assign(__assign({}, session.state), { stage: { type: "first-side-type", input: "", cursorPosition: 0 } }));
                return [4 /*yield*/, keyboard.readLine(function (input, cursorPosition) {
                        session.setState(__assign(__assign({}, session.state), { stage: { type: "first-side-type", input: input, cursorPosition: cursorPosition } }));
                    })];
            case 1:
                answer = _a.sent();
                score = normalizeAnswer(answer) === normalizeAnswer(missingText) ? 4 : 1;
                session.setState(__assign(__assign({}, session.state), { stage: { type: "second-side-typed", input: answer, score: score } }));
                return [4 /*yield*/, keyboard.readKeypress(["space", "return"])];
            case 2:
                _a.sent();
                return [3 /*break*/, 7];
            case 3:
                session.setState(__assign(__assign({}, session.state), { stage: { type: "first-side-reveal" } }));
                return [4 /*yield*/, keyboard.readKeypress(["space", "return"])];
            case 4:
                _a.sent();
                session.setState(__assign(__assign({}, session.state), { stage: { type: "second-side-revealed" } }));
                return [4 /*yield*/, keyboard.readKeypress(["1", "2", "3", "4"])];
            case 5:
                key = _a.sent();
                score = parseInt(key, 10);
                session.setState(__assign(__assign({}, session.state), { stage: { type: "finished", score: score } }));
                return [4 /*yield*/, utils.sleep(800)];
            case 6:
                _a.sent();
                _a.label = 7;
            case 7:
                practiceRecordDAL.writeRecord(fileName, card, card.direction, score);
                if (score === 1) {
                    // Put card back into session since the user didn't remember it
                    session.setState(__assign(__assign({}, session.state), { upcomingCards: __spreadArray(__spreadArray([], session.state.upcomingCards.slice(1), true), [
                            __assign(__assign({}, card), { new: false }),
                        ], false) }));
                }
                else {
                    // Move card to completedCards list
                    session.setState(__assign(__assign({}, session.state), { upcomingCards: session.state.upcomingCards.slice(1), completedCards: __spreadArray(__spreadArray([], session.state.completedCards, true), [
                            __assign(__assign({}, card), { new: false }),
                        ], false) }));
                }
                if (session.state.upcomingCards[0]) {
                    return [2 /*return*/, "next-card"];
                }
                return [2 /*return*/, "finished"];
        }
    });
}); };
var elideText = function (text, maxLength) {
    if (text.length < maxLength) {
        return text;
    }
    return text.substring(0, maxLength - 3) + "...";
};
var addPadding = function (text, length) {
    return text + (0, lodash_1.repeat)(" ", length - text.length);
};
var tableRow = function (items, maxLengths) {
    var renderedItems = [];
    if (items.length !== maxLengths.length) {
        throw Error("Array of lengths doesn't match the array of items");
    }
    for (var i = 0; i < items.length; i++) {
        renderedItems[i] = addPadding(elideText(items[i].toString(), maxLengths[i]), maxLengths[i]);
    }
    return renderedItems.join("  ");
};
var renderHome = function (homePageData, selectedTopicIndex) {
    console.clear();
    console.log("  Welcome to Flashdown by Steve Ridout (beta v0.1)");
    console.log("  ------------------------------------");
    if (homePageData.streak > 0) {
        var callToAction = homePageData.practicedToday
            ? ", return tomorrow to avoid losing it!"
            : "";
        console.log();
        console.log("  You have a ".concat(homePageData.streak, " day streak").concat(callToAction));
    }
    console.log();
    var columnWidths = [25, 15, 20];
    console.log("  " + tableRow(["TOPIC", "TOTAL CARDS", "READY TO PRACTICE"], columnWidths));
    console.log("  " + tableRow(["-----", "-----------", "-----------------"], columnWidths));
    var topicIndex = 0;
    for (var _i = 0, _a = homePageData.topics; _i < _a.length; _i++) {
        var topic = _a[_i];
        console.log("".concat(topicIndex === selectedTopicIndex ? ">" : " ", " ").concat(tableRow([
            topic.name,
            topic.newCards.length +
                topic.learningCardsDue.length +
                topic.learningCardsNotDue.length,
            topic.newCards.length + topic.learningCardsDue.length,
        ], columnWidths)));
        if (homePageData.topics.length > 1 &&
            topicIndex === homePageData.topics.length - 2) {
            console.log();
        }
        topicIndex++;
    }
    console.log();
    console.log();
    console.log(chalk_1.default.greenBright("  Use the UP and DOWN cursor keys to select the topic and hit ENTER to start"));
    // Hide cursor
    process.stdin.write(ansiEscapes.hideCursor);
};
var showHome = function () { return __awaiter(void 0, void 0, void 0, function () {
    var cards, recordsMap, homePageData;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                cards = cardDAL.getCards(fileName);
                recordsMap = practiceRecordDAL.getRecords(fileName);
                homePageData = homePageUtils.calcHomePageData(cards, recordsMap);
                return [4 /*yield*/, homePageLoop(homePageData, homePageData.topics.length - 1)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var homePageLoop = function (homePageData, topicIndex) { return __awaiter(void 0, void 0, void 0, function () {
    var keypress;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                renderHome(homePageData, topicIndex);
                return [4 /*yield*/, keyboard.readKeypress([
                        "space",
                        "return",
                        "up",
                        "down",
                        "j",
                        "k",
                    ])];
            case 1:
                keypress = _a.sent();
                switch (keypress) {
                    case "space":
                    case "return":
                        startSession(homePageData, topicIndex);
                        break;
                    case "up":
                    case "k":
                        homePageLoop(homePageData, Math.max(0, topicIndex - 1));
                        break;
                    case "down":
                    case "j":
                        homePageLoop(homePageData, Math.min(homePageData.topics.length - 1, topicIndex + 1));
                        break;
                }
                return [2 /*return*/];
        }
    });
}); };
var startSession = function (homePageData, topicIndex) { return __awaiter(void 0, void 0, void 0, function () {
    var topic, upcomingCards, nextTime, nextDateString, nextStep, newStreak;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                topic = homePageData.topics[topicIndex];
                upcomingCards = topic.learningCardsDue
                    .slice(0, config_1.default.targetCardsPerSession)
                    .map(function (card) { return (__assign(__assign({}, card.card), { new: false })); });
                if (upcomingCards.length < config_1.default.targetCardsPerSession) {
                    upcomingCards = __spreadArray(__spreadArray([], upcomingCards, true), topic.newCards
                        .slice(0, config_1.default.targetCardsPerSession - upcomingCards.length)
                        .map(function (card) { return (__assign(__assign({}, card), { new: true })); }), true);
                }
                if (!(upcomingCards.length === 0)) return [3 /*break*/, 2];
                nextTime = topic.learningCardsNotDue[0].learningMetrics.nextPracticeTime;
                nextDateString = new Date(nextTime * 1000 * 60).toLocaleString();
                return [4 /*yield*/, alertModal.show("No cards ready to study in this topic. This is because the spaced repetition " +
                        "algorithm has scheduled all the cards to be studied some time in the future.\n\n" +
                        "The next card in this topic is due on ".concat(nextDateString))];
            case 1:
                _a.sent();
                homePageLoop(homePageData, topicIndex);
                return [2 /*return*/];
            case 2:
                session.setState({
                    upcomingCards: _.shuffle(upcomingCards),
                    completedCards: [],
                    stage: { type: "first-side-reveal" }, // XXX This will get overwritten
                });
                console.clear();
                nextStep = "next-card";
                _a.label = 3;
            case 3:
                if (!(nextStep === "next-card")) return [3 /*break*/, 5];
                return [4 /*yield*/, processNextCard()];
            case 4:
                nextStep = _a.sent();
                return [3 /*break*/, 3];
            case 5:
                newStreak = homePageData.streak;
                if (!homePageData.practicedToday) {
                    // The user *hadn't* practiced today before this session, now that they have completed the
                    // session we can increase the streak by 1
                    newStreak += 1;
                }
                return [4 /*yield*/, sessionEnd.run(homePageData.streak, newStreak)];
            case 6:
                _a.sent();
                showHome();
                return [2 /*return*/];
        }
    });
}); };
showHome();
// If user changes the .fd file and we are showing home, update it...
// XXX Need better global app state to know whether we are on home or session
// XXX Should move to cardDAL to avoid breaking abstraction layer
fs.watch("".concat(fileName), function () {
    showHome();
});
process.stdout.on("resize", function () {
    debug.log(process.stdout.columns + " " + process.stdout.rows);
});
//# sourceMappingURL=flashdown.js.map