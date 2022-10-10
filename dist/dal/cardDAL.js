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
exports.getCards = void 0;
var fs = __importStar(require("fs"));
var getCards = function (fileName) {
    var rawFlashcardsFile = fs.readFileSync("".concat(fileName)).toString();
    var lines = rawFlashcardsFile.split("\n");
    var flashcardRegexp = function () { return /^([^:]*): (.*)/; };
    var sectionHeaderRegexp = function () { return /^# (.*)/; };
    var ignoreRegexp = function () { return /^\|/; };
    var currentSection = "Untitled";
    var cards = [];
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        if (ignoreRegexp().test(line)) {
            continue;
        }
        var sectionHeaderMatch = sectionHeaderRegexp().exec(line);
        if (sectionHeaderMatch) {
            currentSection = sectionHeaderMatch[1].trim();
            continue;
        }
        var flashcardMatch = flashcardRegexp().exec(line);
        if (flashcardMatch) {
            var front = flashcardMatch[1].trim();
            var back = flashcardMatch[2].trim();
            var frontToBack = {
                front: front,
                back: back,
                direction: "front-to-back",
                sectionTitle: currentSection,
            };
            var backToFront = {
                front: front,
                back: back,
                direction: "back-to-front",
                sectionTitle: currentSection,
            };
            cards.push(frontToBack);
            cards.push(backToFront);
            continue;
        }
    }
    return cards;
};
exports.getCards = getCards;
//# sourceMappingURL=cardDAL.js.map