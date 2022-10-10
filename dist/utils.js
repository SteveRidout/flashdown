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
exports.wholeDateAddDays = exports.wholeDatesAreEqual = exports.wholeDateFromString = exports.wholeDateToString = exports.wholeDate = exports.sleep = void 0;
var _ = __importStar(require("lodash"));
var sleep = function (duration) {
    return new Promise(function (resolve) {
        setTimeout(function () { return resolve(); }, duration);
    });
};
exports.sleep = sleep;
var wholeDate = function (timeInMinutes) {
    var date = new Date(timeInMinutes * 60 * 1000);
    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
    };
};
exports.wholeDate = wholeDate;
var wholeDateToString = function (wholeDate) {
    return "".concat(wholeDate.year, "-").concat(_.padStart(wholeDate.month.toString(), 2, "0"), "-").concat(_.padStart(wholeDate.day.toString(), 2, "0"));
};
exports.wholeDateToString = wholeDateToString;
var wholeDateFromString = function (rawWholeDate) {
    var _a = rawWholeDate
        .split("-")
        .map(function (raw) { return parseInt(raw, 10); }), year = _a[0], month = _a[1], day = _a[2];
    return {
        year: year,
        month: month,
        day: day,
    };
};
exports.wholeDateFromString = wholeDateFromString;
var wholeDatesAreEqual = function (a, b) {
    return a.year === b.year && a.month === b.month && a.day === b.day;
};
exports.wholeDatesAreEqual = wholeDatesAreEqual;
var wholeDateAddDays = function (wholeDate, days) {
    var year = wholeDate.year, month = wholeDate.month, day = wholeDate.day;
    var date = new Date(Date.UTC(year, month - 1, day + days));
    return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
    };
};
exports.wholeDateAddDays = wholeDateAddDays;
//# sourceMappingURL=utils.js.map