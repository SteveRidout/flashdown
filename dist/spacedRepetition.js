"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSpacedRepetitionInfo = exports.getNextPracticeTime = void 0;
// The spaced repetition algorithm is inspired by SM2, originally used in SuperMemo and a variant of
// which is used in the popular flashcard app Anki.
// This variant changes SM2 in the following ways:
// - Only 4 answer states, like Anki (1 - 4, mapping to the keys which are used)
// - Easiness factor calculation is simplified for better readability
// - After failing a card, it is scheduled for immediate review and will be shown to the user within
//   the current session (but with other cards in between if they exist)
/** This assumes that the records are in chronological order */
var getNextPracticeTime = function (records) {
    var easinessFactor = 2.5;
    var previous;
    var nextPracticeTime;
    var _loop_1 = function (record) {
        if (previous !== undefined && record.practiceTime < previous.time) {
            throw Error("Practice records not in chronological order");
        }
        var easinessDelta = (function () {
            switch (record.score) {
                case 1:
                    return -0.8;
                case 2:
                    return -0.2;
                case 3:
                    return 0;
                case 4:
                    return 0.1;
                default:
                    throw Error("Invalid score");
            }
        })();
        easinessFactor = Math.max(1.3, easinessFactor + easinessDelta);
        var nextInterval = (function () {
            switch (record.score) {
                case 1:
                    // Practice immediately
                    return 0;
                case 2:
                case 3:
                case 4:
                    if (previous === undefined) {
                        return 60 * 6 * record.score;
                    }
                    var interval = (record.practiceTime - previous.time) * easinessFactor;
                    // Since the user got this right, let's ensure that the next interval can't decrease
                    // compared to the previous one. This is only for the case where the user happened to
                    // practice before the scheduled time, e.g. perhaps they are cramming before an exam.
                    return Math.max(previous.interval, interval);
                default:
                    throw Error("Invalid score");
            }
        })();
        nextPracticeTime = record.practiceTime + nextInterval;
        previous = {
            time: record.practiceTime,
            interval: nextInterval,
        };
    };
    for (var _i = 0, records_1 = records; _i < records_1.length; _i++) {
        var record = records_1[_i];
        _loop_1(record);
    }
    return nextPracticeTime;
};
exports.getNextPracticeTime = getNextPracticeTime;
var getSpacedRepetitionInfo = function (records) {
    var easinessFactor = 2.5;
    var previous;
    var nextPracticeTime;
    var _loop_2 = function (record) {
        if (previous !== undefined && record.practiceTime < previous.time) {
            throw Error("Practice records not in chronological order");
        }
        var easinessDelta = (function () {
            switch (record.score) {
                case 1:
                    return -0.8;
                case 2:
                    return -0.2;
                case 3:
                    return 0;
                case 4:
                    return 0.1;
                default:
                    throw Error("Invalid score");
            }
        })();
        easinessFactor = Math.max(1.3, easinessFactor + easinessDelta);
        var previousInterval = previous === undefined ? undefined : record.practiceTime - previous.time;
        var nextInterval = (function () {
            switch (record.score) {
                case 1:
                    // Practice immediately
                    return 0;
                case 2:
                case 3:
                case 4:
                    if (previousInterval === undefined || previous === undefined) {
                        return 60 * 6 * record.score;
                    }
                    var interval = previousInterval * easinessFactor;
                    // Since the user got this right, let's ensure that the next interval can't decrease
                    // compared to the previous one. This is only for the case where the user happened to
                    // practice before the scheduled time, e.g. perhaps they are cramming before an exam.
                    return Math.max(previous.nextInterval, interval);
                default:
                    throw Error("Invalid score");
            }
        })();
        nextPracticeTime = record.practiceTime + nextInterval;
        previous = {
            time: record.practiceTime,
            score: record.score,
            previousInterval: previousInterval,
            nextInterval: nextInterval,
        };
    };
    for (var _i = 0, records_2 = records; _i < records_2.length; _i++) {
        var record = records_2[_i];
        _loop_2(record);
    }
    if (!previous || !nextPracticeTime) {
        return undefined;
    }
    return {
        previousInterval: previous.previousInterval,
        previousScore: previous.score,
        nextPracticeTime: nextPracticeTime,
    };
};
exports.getSpacedRepetitionInfo = getSpacedRepetitionInfo;
//# sourceMappingURL=spacedRepetition.js.map