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
exports.getRecords = exports.writeRecord = void 0;
var fs = __importStar(require("fs"));
var parseDirection = function (rawDirection) {
    switch (rawDirection) {
        case "f":
            return "front-to-back";
        case "b":
            return "back-to-front";
        default:
            throw Error("Unrecognized direction");
    }
};
var serializeDirection = function (direction) {
    switch (direction) {
        case "front-to-back":
            return "f";
        case "back-to-front":
            return "b";
    }
};
var writtenToLogFile = false;
var writeRecord = function (cardsFileName, card, direction, success) {
    var fileName = getPracticeRecordFilename(cardsFileName);
    if (!fs.existsSync(fileName)) {
        fs.writeFileSync(fileName, "");
    }
    if (!writtenToLogFile) {
        var sessionHeader = "";
        if (fs.existsSync(fileName) &&
            fs.readFileSync(fileName).toString().length > 0) {
            sessionHeader += "\n\n";
        }
        sessionHeader += "# ".concat(currentDateTimeString(), "\n");
        fs.appendFileSync(fileName, sessionHeader);
        writtenToLogFile = true;
    }
    fs.appendFileSync(fileName, "\n".concat(card.front, ", ").concat(serializeDirection(direction), ": ").concat(success));
};
exports.writeRecord = writeRecord;
var currentDateTimeString = function () {
    var date = new Date();
    return "".concat(date.getFullYear(), "-").concat(addZeroPadding(date.getMonth() + 1, 2), "-").concat(addZeroPadding(date.getDate(), 2), " ").concat(addZeroPadding(date.getHours(), 2), ":").concat(addZeroPadding(date.getMinutes(), 2));
};
var addZeroPadding = function (value, totalDigits) {
    var numberString = "".concat(value);
    while (numberString.length < totalDigits) {
        numberString = "0".concat(numberString);
    }
    return numberString;
};
var parseDateTimeString = function (rawDateTime) {
    var regExp = /([0-9]{4})-([0-9]{2})-([0-9]{2}) ([0-9]{2}):([0-9]{2})/;
    var match = regExp.exec(rawDateTime);
    if (!match) {
        throw Error("Datetime string not valid: " + rawDateTime);
    }
    var components = match
        .slice(1)
        .map(function (rawNumber) { return parseInt(rawNumber, 10); });
    return new Date(components[0], components[1] - 1, components[2], components[3], components[4]);
};
// XXX for now just one success value per line, but we could make this more compact and still just
// as readable (if not more readable) by including multiple success values per line
var practiceRecordRegexp = function () { return /^([^:]+), (f|b): ([0-5])/; };
var getPracticeRecordFilename = function (cardsFileName) {
    // Remove .fd suffix from the card file name to get the base name
    var baseName = cardsFileName.endsWith(".fd")
        ? cardsFileName.substring(0, cardsFileName.length - 3)
        : cardsFileName;
    return "".concat(baseName, ".fdr");
};
var getRecords = function (cardsFileName) {
    var _a;
    var fileName = getPracticeRecordFilename(cardsFileName);
    if (!fs.existsSync(fileName)) {
        return {};
    }
    var lines = fs
        .readFileSync(fileName)
        .toString()
        .split("\n")
        .filter(function (line) { return line.trim().length > 0; });
    // Should this be a Map instead to avoid the issue with certain keys on object?
    var practiceRecordsMap = {};
    var currentDate;
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        if (line.startsWith("# ")) {
            currentDate = parseDateTimeString(line.substring(2));
            console.log("found date: ", currentDate);
            continue;
        }
        var match = practiceRecordRegexp().exec(line);
        if (match) {
            if (!currentDate) {
                throw Error("No date associated with practice record");
            }
            var front = match[1];
            var direction = parseDirection(match[2]);
            var success = parseInt(match[3]);
            practiceRecordsMap[front] = (_a = practiceRecordsMap[front]) !== null && _a !== void 0 ? _a : {
                "front-to-back": [],
                "back-to-front": [],
            };
            practiceRecordsMap[front][direction].push({
                practiceTime: Math.floor((currentDate === null || currentDate === void 0 ? void 0 : currentDate.getTime()) / 1000 / 60),
                score: success,
            });
        }
    }
    return practiceRecordsMap;
};
exports.getRecords = getRecords;
//# sourceMappingURL=practiceRecordDAL.js.map