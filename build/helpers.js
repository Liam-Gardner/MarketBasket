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
exports.callR = exports.convertRulesToJson = exports.parseMenu = void 0;
var fs = __importStar(require("fs"));
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
    // removes {} from lhs and rhs
    // may need to remove "" from key & value if returning menu item id's
    var lhs = parsedJson.lhs.map(function (str) { return str.replace(/[{}]/gm, ''); });
    var rhs = parsedJson.rhs.map(function (str) { return str.replace(/[{}]/gm, ''); });
    console.log('json rules length: ', lhs.length);
    // need to
    var keyValPairs = lhs.reduce(function (obj, value, index) {
        console.log('obj', obj);
        console.log('val', value);
        // check if obj[value] exists in obj
        // if true then compare the lift of each and keep the highest
        // or a hacky-ish way. The first key will be the one we want to keep becuz they are already sorted by lift
        var duplicate = Object.keys(obj).find(function (k) { return k === value; });
        if (!duplicate) {
            obj[value] = rhs[index];
        }
        return obj;
    }, {});
    console.log('keyValPairs type', typeof keyValPairs);
    return keyValPairs;
};
exports.callR = function (path, storeId, confidence, rulesAmount, byItemName) {
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
