"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMetabaseQuery = exports.constructRulesTimeQuantityQuery = exports.constructRulesandTimeQuery = exports.constructRulesQuery = exports.constructMenuQuery = exports.metabaseLogin = void 0;
var axios = require('axios').default;
var qs = require('querystring');
var env = require('process').env;
require('dotenv').config();
exports.metabaseLogin = function (username, password) { return __awaiter(void 0, void 0, void 0, function () {
    var mbToken, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, axios.post(process.env.METABASE_URL + "/api/session", {
                        username: username,
                        password: password,
                    }, { headers: { 'Content-Type': 'application/json' } })];
            case 1:
                mbToken = _a.sent();
                return [2 /*return*/, mbToken];
            case 2:
                error_1 = _a.sent();
                console.log(error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.constructMenuQuery = function (storeId) {
    return "{\"database\": 2, \"type\": \"native\", \"native\": {\"query\": \"SELECT mi.Name \n    FROM Menusections ms \n    JOIN Menuitems mi \n    ON ms.Menusectionid = mi.Menusectionid \n    WHERE ms.MenuId =\n    (SELECT MenuId \n    FROM PhysicalRestaurants \n    WHERE PhysicalRestaurantId = " + storeId + ")\"}}";
};
exports.constructRulesQuery = function (byItemName, storeId) {
    var sqlQuery;
    if (byItemName == 'True') {
        sqlQuery = "{\"database\": 2, \"type\": \"native\", \"native\": {\"query\": \"SELECT o.OrderId, mi.Name FROM PhysicalRestaurants pr JOIN Orders o ON o.PhysicalRestaurantId = pr.PhysicalRestaurantId JOIN OrderItems oi ON oi.Order_OrderId = o.OrderId JOIN MenuItems mi ON mi.MenuItemId = oi.MenuItemId WHERE pr.PhysicalRestaurantId = " + storeId + "\"}}";
    }
    else {
        sqlQuery = "{\"database\": 2, \"type\": \"native\", \"native\": {\"query\": \"SELECT o.OrderId, mi.MenuItemId FROM PhysicalRestaurants pr JOIN Orders o ON o.PhysicalRestaurantId = pr.PhysicalRestaurantId JOIN OrderItems oi ON oi.Order_OrderId = o.OrderId JOIN MenuItems mi ON mi.MenuItemId = oi.MenuItemId WHERE pr.PhysicalRestaurantId = " + storeId + "\"}}";
    }
    return sqlQuery;
};
exports.constructRulesandTimeQuery = function (byItemName, storeId) {
    var sqlQuery;
    if (byItemName == 'True') {
        sqlQuery = "{\"database\": 2, \"type\": \"native\", \"native\": {\"query\": \"SELECT o.OrderId, mi.Name, o.TsOrderPlaced FROM PhysicalRestaurants pr JOIN Orders o ON o.PhysicalRestaurantId = pr.PhysicalRestaurantId JOIN OrderItems oi ON oi.Order_OrderId = o.OrderId JOIN MenuItems mi ON mi.MenuItemId = oi.MenuItemId WHERE pr.PhysicalRestaurantId = " + storeId + "\"}}";
    }
    else {
        sqlQuery = "{\"database\": 2, \"type\": \"native\", \"native\": {\"query\": \"SELECT o.OrderId, mi.MenuItemId, o.TsOrderPlaced FROM PhysicalRestaurants pr JOIN Orders o ON o.PhysicalRestaurantId = pr.PhysicalRestaurantId JOIN OrderItems oi ON oi.Order_OrderId = o.OrderId JOIN MenuItems mi ON mi.MenuItemId = oi.MenuItemId WHERE pr.PhysicalRestaurantId = " + storeId + "\"}}";
    }
    return sqlQuery;
};
exports.constructRulesTimeQuantityQuery = function (byItemName, storeId) {
    var sqlQuery;
    if (byItemName == 'True') {
        sqlQuery = "{\"database\": 2, \"type\": \"native\", \"native\": {\"query\": \"SELECT o.OrderId, mi.Name, o.TsOrderPlaced,oi.MenuItemId, COUNT(*) as 'Quantity' FROM PhysicalRestaurants pr JOIN Orders o ON o.PhysicalRestaurantId = pr.PhysicalRestaurantId JOIN OrderItems oi ON oi.Order_OrderId = o.OrderId JOIN MenuItems mi ON mi.MenuItemId = oi.MenuItemId WHERE pr.PhysicalRestaurantId = " + storeId + " GROUP BY o.OrderId,mi.Name, o.TsOrderPlaced, oi.MenuItemId\"}}";
    }
    else {
        sqlQuery = "{\"database\": 2, \"type\": \"native\", \"native\": {\"query\": \"SELECT o.OrderId, mi.MenuItemId, o.TsOrderPlaced FROM PhysicalRestaurants pr JOIN Orders o ON o.PhysicalRestaurantId = pr.PhysicalRestaurantId JOIN OrderItems oi ON oi.Order_OrderId = o.OrderId JOIN MenuItems mi ON mi.MenuItemId = oi.MenuItemId WHERE pr.PhysicalRestaurantId = " + storeId + "\"}}";
    }
    return sqlQuery;
};
exports.sendMetabaseQuery = function (mbToken, sqlQuery, format) { return __awaiter(void 0, void 0, void 0, function () {
    var url, config;
    return __generator(this, function (_a) {
        url = process.env.METABASE_URL + "/api/dataset/" + format;
        config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Metabase-Session': mbToken,
            },
        };
        try {
            return [2 /*return*/, axios.post(url, qs.stringify({ query: sqlQuery }), config)];
        }
        catch (error) {
            console.log(error);
        }
        return [2 /*return*/];
    });
}); };
