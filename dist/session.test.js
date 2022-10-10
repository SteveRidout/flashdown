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
var session = __importStar(require("./session"));
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
describe("addFrame", function () {
    test("card body text, width 20", function () {
        expect(session.addFrame(testCardBody, 30)).toStrictEqual({
            cursorPosition: undefined,
            text: "\u250F\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2513\n\u2503 Topic: Spanish words       \u2503\n\u2503                            \u2503\n\u2503 La puta madre: The whore   \u2503\n\u2503 mother (that's awesome!)   \u2503\n\u2517\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u251B",
        });
    });
    test("card body text, width 30", function () {
        expect(session.addFrame(testCardBody, 30)).toStrictEqual({
            cursorPosition: undefined,
            text: "\u250F\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2513\n\u2503 Topic: Spanish words       \u2503\n\u2503                            \u2503\n\u2503 La puta madre: The whore   \u2503\n\u2503 mother (that's awesome!)   \u2503\n\u2517\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u251B",
        });
    });
    test("card body text with cursor, width 30", function () {
        expect(session.addFrame(testCardBodyWithCursor, 30)).toStrictEqual({
            cursorPosition: {
                x: 17,
                y: 3,
            },
            text: "\u250F\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2513\n\u2503 Topic: Spanish words       \u2503\n\u2503                            \u2503\n\u2503 La puta madre: ___________ \u2503\n\u2503 _______________________    \u2503\n\u2517\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u251B",
        });
    });
});
describe("createCard", function () {
    test("Big blank to reflow", function () {
        expect(session.createCard("Spanish", {
            text: "This is a test which includes a blank here: _____________________________",
            cursorPosition: { x: 44, y: 0 },
        })).toStrictEqual({
            cursorPosition: {
                x: 46,
                y: 3,
            },
            text: "\u250F\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2513\n\u2503 Topic: Spanish                                           \u2503\n\u2503                                                          \u2503\n\u2503 This is a test which includes a blank here: ____________ \u2503\n\u2503 _________________                                        \u2503\n\u2503                                                          \u2503\n\u2517\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u251B",
        });
    });
    test("Blank on front side", function () {
        expect(session.createCard("Spanish", {
            text: "_______________: This is a test which includes a blank on the first side <---",
            cursorPosition: { x: 0, y: 0 },
        })).toStrictEqual({
            cursorPosition: {
                x: 2,
                y: 3,
            },
            text: "\u250F\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2513\n\u2503 Topic: Spanish                                           \u2503\n\u2503                                                          \u2503\n\u2503 _______________: This is a test which includes a blank   \u2503\n\u2503 on the first side <---                                   \u2503\n\u2503                                                          \u2503\n\u2517\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u251B",
        });
    });
    test("With cursor 2", function () {
        expect(session.createCard("Celsius/Fahrenheit conversion", {
            text: "176C : ____",
            cursorPosition: { x: 7, y: 0 },
        })).toStrictEqual({
            cursorPosition: {
                x: 9,
                y: 3,
            },
            text: "\u250F\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2513\n\u2503 Topic: Celsius/Fahrenheit conversion                     \u2503\n\u2503                                                          \u2503\n\u2503 176C : ____                                              \u2503\n\u2503                                                          \u2503\n\u2517\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u251B",
        });
    });
    test("With cursor 3", function () {
        expect(session.createCard("Solar energy", {
            text: "What was the total electricity consumption of Spain in 2018? : _______",
            cursorPosition: { x: 63, y: 0 },
        })).toStrictEqual({
            cursorPosition: {
                x: 10,
                y: 4,
            },
            text: "\u250F\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2513\n\u2503 Topic: Solar energy                                      \u2503\n\u2503                                                          \u2503\n\u2503 What was the total electricity consumption of Spain in   \u2503\n\u2503 2018? : _______                                          \u2503\n\u2503                                                          \u2503\n\u2517\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u251B",
        });
    });
});
//# sourceMappingURL=session.test.js.map