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
exports.calcHomePageData = void 0;
var spacedRepetition = __importStar(require("./spacedRepetition"));
var utils = __importStar(require("./utils"));
var emptyTopic = function (name) { return ({
    name: name,
    newCards: [],
    learningCardsNotDue: [],
    learningCardsDue: [],
    masteryScore: 0,
}); };
var calcHomePageData = function (cards, recordMap) {
    var _a;
    var _b, _c;
    var cardMap = {};
    for (var _i = 0, cards_1 = cards; _i < cards_1.length; _i++) {
        var card = cards_1[_i];
        cardMap[card.front] = __assign(__assign({}, ((_b = cardMap[card.front]) !== null && _b !== void 0 ? _b : {})), (_a = {}, _a[card.direction] = card, _a));
    }
    var currentTime = Math.floor(new Date().getTime() / (60 * 1000));
    var currentWholeDate = utils.wholeDate(currentTime);
    var topicMap = {};
    var homePageData = {
        topics: [],
        practiceHistory: [],
        practicedToday: false,
        streak: 0,
    };
    var allTopics = {
        name: "All Topics",
        newCards: [],
        learningCardsNotDue: [],
        learningCardsDue: [],
        masteryScore: 0,
    };
    var wholeDateSet = new Set();
    var _loop_1 = function (card) {
        var learningMetrics = (function () {
            var _a;
            var practiceRecords = (_a = recordMap[card.front]) === null || _a === void 0 ? void 0 : _a[card.direction];
            if (practiceRecords === undefined) {
                return undefined;
            }
            for (var _i = 0, practiceRecords_1 = practiceRecords; _i < practiceRecords_1.length; _i++) {
                var practiceRecord = practiceRecords_1[_i];
                var recordWholeDate = utils.wholeDate(practiceRecord.practiceTime);
                wholeDateSet.add(utils.wholeDateToString(recordWholeDate));
                if (utils.wholeDatesAreEqual(recordWholeDate, currentWholeDate)) {
                    homePageData.practicedToday = true;
                }
            }
            return spacedRepetition.getSpacedRepetitionInfo(practiceRecords);
        })();
        // Add card to home page data:
        var topicName = card.sectionTitle;
        topicMap[topicName] = (_c = topicMap[topicName]) !== null && _c !== void 0 ? _c : emptyTopic(topicName);
        if (learningMetrics === undefined) {
            allTopics.newCards.push(card);
            topicMap[topicName].newCards.push(card);
        }
        else if (learningMetrics.nextPracticeTime < currentTime) {
            allTopics.learningCardsDue.push({ card: card, learningMetrics: learningMetrics });
            topicMap[topicName].learningCardsDue.push({
                card: card,
                learningMetrics: learningMetrics,
            });
        }
        else {
            allTopics.learningCardsNotDue.push({
                card: card,
                learningMetrics: learningMetrics,
            });
            topicMap[topicName].learningCardsNotDue.push({
                card: card,
                learningMetrics: learningMetrics,
            });
        }
    };
    for (var _d = 0, cards_2 = cards; _d < cards_2.length; _d++) {
        var card = cards_2[_d];
        _loop_1(card);
    }
    homePageData.topics = Object.values(topicMap);
    if (homePageData.topics.length > 1) {
        homePageData.topics.push(allTopics);
    }
    var rawDates = Array.from(wholeDateSet);
    rawDates.sort();
    homePageData.practiceHistory = rawDates.map(function (rawDate) {
        return utils.wholeDateFromString(rawDate);
    });
    // Calculate streak
    var streak = homePageData.practicedToday ? 1 : 0;
    var previousDay = utils.wholeDateAddDays(currentWholeDate, -1);
    while (wholeDateSet.has(utils.wholeDateToString(previousDay))) {
        streak++;
        previousDay = utils.wholeDateAddDays(previousDay, -1);
    }
    homePageData.streak = streak;
    return homePageData;
};
exports.calcHomePageData = calcHomePageData;
//# sourceMappingURL=homePageUtils.js.map