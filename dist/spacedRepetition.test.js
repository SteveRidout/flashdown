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
Object.defineProperty(exports, "__esModule", { value: true });
var globals_1 = require("@jest/globals");
var spacedRepetition = __importStar(require("./spacedRepetition"));
var minutesSinceEpoch = function (date) {
    return Math.floor(date.getTime() / (60 * 1000));
};
(0, globals_1.describe)("spacedRepetition", function () {
    (0, globals_1.test)("getSpacedRepetitionInfo", function () {
        (0, globals_1.expect)(spacedRepetition.getSpacedRepetitionInfo([
            {
                practiceTime: minutesSinceEpoch(new Date(2022, 10, 7)),
                score: 4,
            },
        ])).toStrictEqual({
            nextPracticeTime: minutesSinceEpoch(new Date(2022, 10, 8)),
            previousInterval: undefined,
            previousScore: 4,
        });
    });
});
//# sourceMappingURL=spacedRepetition.test.js.map