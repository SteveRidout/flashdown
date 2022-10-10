"use strict";
// Designed to be run directly with ts-node for now since we don't have a proper unit testing
// framework set up yet.
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
var renderUtils = __importStar(require("./renderUtils"));
var testTextWithCursor = {
    text: "Heading\n\nThis is some test text with a blank here _______ and this is the end.",
    cursorPosition: {
        x: 40,
        y: 2,
    },
};
var testTextWithoutCursor = {
    text: "Heading\n\nThis is some test text without a blank and a cursor.",
};
var testCardBody = {
    text: "Topic: Spanish words\n\nLa puta madre: The whore mother (that's awesome!)",
};
var testCardBodyWithCursor = {
    text: "Topic: Spanish words\n\nLa puta madre: __________________________________",
    cursorPosition: {
        x: 15,
        y: 2,
    },
};
describe("splitIntoLines", function () {
    test("without cursor", function () {
        expect(renderUtils.splitIntoLines(testTextWithoutCursor)).toStrictEqual([
            { text: "Heading" },
            { text: "" },
            { text: "This is some test text without a blank and a cursor." },
        ]);
    });
    test("with cursor", function () {
        expect(renderUtils.splitIntoLines(testTextWithCursor)).toStrictEqual([
            { text: "Heading" },
            { text: "" },
            {
                cursorPosition: { x: 40, y: 0 },
                text: "This is some test text with a blank here _______ and this is the end.",
            },
        ]);
    });
});
describe("reflowText", function () {
    test("width 30", function () {
        expect(renderUtils.reflowText(testTextWithoutCursor, 30)).toStrictEqual({
            cursorPosition: undefined,
            text: "Heading\n\nThis is some test text without\na blank and a cursor.",
        });
    });
    test("width 20", function () {
        expect(renderUtils.reflowText(testTextWithoutCursor, 20)).toStrictEqual({
            cursorPosition: undefined,
            text: "Heading\n\nThis is some test\ntext without a blank\nand a cursor.",
        });
    });
    test("width 30 with cursor position", function () {
        expect(renderUtils.reflowText(testTextWithCursor, 30)).toStrictEqual({
            cursorPosition: { x: 10, y: 3 },
            text: "Heading\n\nThis is some test text with a\nblank here _______ and this is\nthe end.",
        });
    });
    test("width 15 with cursor position", function () {
        expect(renderUtils.reflowText(testTextWithCursor, 15)).toStrictEqual({
            cursorPosition: { x: 12, y: 4 },
            text: "Heading\n\nThis is some\ntest text with\na blank here __\n_____ and this\nis the end.",
        });
    });
    test("width 15 with cursor position", function () {
        expect(renderUtils.reflowText({
            text: "What was the total electricity consumption of Spain in 2018? : _______",
            cursorPosition: { x: 63, y: 0 },
        }, 50)).toStrictEqual({
            cursorPosition: { x: 17, y: 1 },
            text: "What was the total electricity consumption of\nSpain in 2018? : _______",
        });
    });
});
//# sourceMappingURL=renderUtils.test.js.map