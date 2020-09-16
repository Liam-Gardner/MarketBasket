"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeFile = exports.makeDirectory = exports.checkIfPlotsExist = exports.checkIfRulesExist = exports.getPlotsR = exports.getRulesR = exports.convertRulesToJson = exports.parseMenu = void 0;
var fs = __importStar(require("fs"));
var fs_1 = require("fs");
var spawn = require('child_process').spawn;
exports.parseMenu = function (jsonMenu) {
    var menuStrings = jsonMenu.map(function (r) { return Object.values(r); }).toString();
    var menuArray = menuStrings.split(',');
    var uniqueItems = __spread(new Set(menuArray));
    return uniqueItems;
};
exports.convertRulesToJson = function (storeId) {
    var data = fs.readFileSync(storeId + "/" + storeId + "-rules.json", 'utf8');
    var parsedJson = JSON.parse(data);
    var support = parsedJson.support, confidence = parsedJson.confidence, lift = parsedJson.lift, count = parsedJson.count;
    var lhs = parsedJson.lhs.map(function (str) { return str.replace(/[{}]/gm, ''); });
    var rhs = parsedJson.rhs.map(function (str) { return str.replace(/[{}]/gm, ''); });
    var rule = {};
    var rules = [];
    var _loop_1 = function (i) {
        rule = {
            number: i + 1,
            lhs: lhs[i],
            rhs: rhs[i],
            lift: lift[i],
            confidence: confidence[i],
            count: count[i],
            support: support[i],
        };
        var isDuplicate = rules.some(function (obj) { return obj.lhs === lhs[i]; });
        if (!isDuplicate) {
            rules.push(rule);
        }
    };
    for (var i = 0; i < parsedJson.lhs.length; i++) {
        _loop_1(i);
    }
    return rules;
};
exports.getRulesR = function (path, storeId, confidence, rulesAmount, byItemName) {
    return new Promise(function (resolve, reject) {
        console.log('callR....');
        var err = false;
        var child = spawn(process.env.RSCRIPT, [
            '--vanilla',
            path,
            '--args',
            storeId,
            confidence,
            rulesAmount,
            byItemName,
        ]);
        child.stderr.on('data', function (data) {
            console.log(data.toString());
        });
        child.stdout.on('data', function (data) {
            console.log(data.toString());
        });
        child.on('error', function (error) {
            err = true;
            reject(error);
        });
        child.on('exit', function () {
            if (err)
                return; // debounce - already rejected
            resolve('done.'); // TODO: check exit code and resolve/reject accordingly
        });
    });
};
exports.getPlotsR = function (path, storeId) {
    return new Promise(function (resolve, reject) {
        console.log('callRPlots....');
        var err = false;
        var child = spawn(process.env.RSCRIPT, ['--vanilla', path, '--args', storeId]);
        child.stderr.on('data', function (data) {
            console.log(data.toString());
        });
        child.stdout.on('data', function (data) {
            console.log(data.toString());
        });
        child.on('error', function (error) {
            err = true;
            reject(error);
        });
        child.on('exit', function () {
            if (err)
                return; // debounce - already rejected
            resolve('done.'); // TODO: check exit code and resolve/reject accordingly
        });
    });
};
exports.checkIfRulesExist = function (storeId) {
    if (fs.existsSync(storeId + "/" + storeId + "-rules.json")) {
        console.log('The path exists.');
        return true;
    }
    else {
        return false;
    }
};
exports.checkIfPlotsExist = function (storeId) {
    if (fs.existsSync("plots/" + storeId)) {
        // TODO: check if folder contains images!
        console.log('The path exists.');
        return true;
    }
    else {
        return false;
    }
};
exports.makeDirectory = function (filePath, recursive) { return __awaiter(void 0, void 0, void 0, function () {
    var err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fs_1.promises.mkdir(filePath, { recursive: recursive })];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                err_1 = _a.sent();
                throw err_1;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.writeFile = function (filePath, data) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        try {
            fs_1.promises.writeFile(filePath, data);
        }
        catch (err) {
            throw err;
        }
        return [2 /*return*/];
    });
}); };
//#region Test data
var testData = {
    lhs: [
        'Trio of Chocolate',
        'White Chocolate and Raspberry Mousse',
        'Chilli Chicken Ramen,Thai Red Curry',
        'Chilli Chicken Ramen,Coca-Cola',
        'Coca-Cola,Thai Red Curry',
    ],
    rhs: [
        'White Chocolate and Raspberry Mousse',
        'Trio of Chocolate',
        'Chicken Egg Fried Rice',
        'Chicken Egg Fried Rice',
        'Chicken Egg Fried Rice',
    ],
    support: [
        0.00115673799884326,
        0.00115673799884326,
        0.00115673799884326,
        0.00115673799884326,
        0.00115673799884326,
    ],
    confidence: [1, 1, 1, 1, 1],
    lift: [864.5, 864.5, 864.5, 864.5, 864.5],
    count: [4, 4, 4, 4, 4],
};
//#endregion
