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
Object.defineProperty(exports, "__esModule", { value: true });
var express = __importStar(require("express"));
var router = express.Router();
var path = require('path');
var env = require('process').env;
require('dotenv').config();
var metabase_1 = require("../../models/metabase");
var helpers_1 = require("../../helpers");
var rscriptRulesPath = path.resolve('./', 'R', 'useMetabase.R');
var rscriptPlotsPath = path.resolve('./', 'R', 'getPlots.R');
//#region Login to Metabase then getRules
router.post('/login-dbs', function (req, res) {
    var _a = req.body, storeId = _a.storeId, confidence = _a.confidence, rulesAmount = _a.rulesAmount, byItemName = _a.byItemName, username = _a.username, password = _a.password;
    if (username === env.DBS_USER && password === env.DBS_PASS) {
        metabase_1.metabaseLogin(env.METABASE_USER, env.METABASE_PASS)
            .then(function (result) {
            var mbToken = encodeURIComponent(result.data.id);
            res.redirect(307, "/useMetabase/getRules?mbToken=" + mbToken + "&storeId=" + storeId + "&confidence=" + confidence + "&rulesAmount=" + rulesAmount + "&byItemName=" + byItemName);
        })
            .catch(function (err) { return res.status(500).send(err); });
    }
    else {
        res.status(401).send('Wrong password or username'); // TODO: handle this in FE
    }
});
// Store demo page
router.post('/login-dbs-demo', function (req, res) {
    var _a = req.body, storeId = _a.storeId, username = _a.username, password = _a.password;
    if (username === env.DBS_USER && password === env.DBS_PASS) {
        metabase_1.metabaseLogin(env.METABASE_USER, env.METABASE_PASS)
            .then(function (result) {
            var mbToken = encodeURIComponent(result.data.id);
            res.redirect(307, "/useMetabase/getMenuItems?mbToken=" + mbToken + "&storeId=" + storeId);
        })
            .catch(function (err) { return res.status(500).send(err); });
    }
    else {
        res.status(401).send('Wrong password or username'); // handle this in FE
    }
});
//#endregion
//#region main redirected routes
//#region GET RULES
router.post('/getRules', function (req, res) {
    var mbToken = req.query.mbToken;
    var storeId = req.query.storeId;
    var confidence = req.query.confidence;
    var rulesAmount = req.query.rulesAmount;
    var byItemName = req.query.byItemName;
    var rulesExist = helpers_1.checkIfRulesExist(storeId);
    var plotsExist = helpers_1.checkIfPlotsExist(storeId);
    if (rulesExist) {
        var rules_1 = helpers_1.convertRulesToJson(storeId);
        if (plotsExist) {
            res.status(200).send({
                rules: rules_1,
                itemsBoughtPlot: "/plots/" + storeId + "/itemsBoughtPlot.png",
                popularTimesPlot: "/plots/" + storeId + "/popularTimesPlot.png",
                topTenBestSellersPlot: "/plots/" + storeId + "/topTenBestSellersPlot.png",
            });
        }
        else {
            helpers_1.makeDirectory("plots/" + storeId, false)
                .then(function () {
                helpers_1.getPlotsR(rscriptPlotsPath, storeId).then(function () {
                    res.status(200).send({
                        rules: rules_1,
                        itemsBoughtPlot: "/plots/" + storeId + "/itemsBoughtPlot.png",
                        popularTimesPlot: "/plots/" + storeId + "/popularTimesPlot.png",
                        topTenBestSellersPlot: "/plots/" + storeId + "/topTenBestSellersPlot.png",
                    });
                });
            })
                .catch(function (error) {
                console.log('callRPlots error', error);
                res.sendStatus(500);
            })
                .catch(function (error) {
                console.log('plots mkdir error', error);
                res.sendStatus(500);
            });
        }
    }
    else {
        var sqlQuery = metabase_1.constructRulesTimeQuantityQuery(byItemName, storeId);
        metabase_1.sendMetabaseQuery(mbToken, sqlQuery, 'csv')
            .then(function (result) {
            var data = result.data;
            helpers_1.makeDirectory(storeId, true)
                .then(function () {
                helpers_1.writeFile(storeId + "/" + storeId + "-data.csv", data)
                    .then(function () {
                    helpers_1.getRulesR(rscriptRulesPath, storeId, confidence, rulesAmount, byItemName)
                        .then(function () {
                        var rules = helpers_1.convertRulesToJson(storeId);
                        helpers_1.makeDirectory("plots/" + storeId, false)
                            .then(function () {
                            helpers_1.getPlotsR(rscriptPlotsPath, storeId)
                                .then(function () {
                                res.status(200).send({
                                    rules: rules,
                                    itemsBoughtPlot: "/plots/" + storeId + "/itemsBoughtPlot.png",
                                    popularTimesPlot: "/plots/" + storeId + "/popularTimesPlot.png",
                                    topTenBestSellersPlot: "/plots/" + storeId + "/topTenBestSellersPlot.png",
                                });
                            })
                                .catch(function (error) {
                                console.log('callRPlots error', error);
                                res.sendStatus(500);
                            });
                        })
                            .catch(function (error) {
                            console.log('plots mkdir error', error);
                            res.sendStatus(500);
                        });
                    })
                        .catch(function (error) {
                        console.log('callR - error: ', error);
                        res.status(500).send(error);
                    });
                })
                    .catch(function (error) {
                    console.log('storeId writefile error', error);
                    res.sendStatus(500);
                });
            })
                .catch(function (error) {
                console.log('storeId mkDir error', error);
                res.sendStatus(500);
            });
        })
            .catch(function (error) {
            console.log('MB Query - error: ', error);
            res.status(500).send(error);
        });
    }
});
//#endregion
//#region GET Menu items for mock store
router.post('/getMenuItems', function (req, res) {
    var mbToken = req.query.mbToken;
    var storeId = req.query.storeId;
    var sqlQuery = metabase_1.constructMenuQuery(storeId);
    metabase_1.sendMetabaseQuery(mbToken, sqlQuery, 'json')
        .then(function (result) {
        var menu = helpers_1.parseMenu(result.data);
        res.status(200).send(menu);
    })
        .catch(function (err) { return res.status(500).send(err); });
});
//#endregion
//#endregion
module.exports = router;
