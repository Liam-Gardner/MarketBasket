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
var fs = __importStar(require("fs"));
require('dotenv').config();
var metabase_1 = require("../../models/metabase");
var helpers_1 = require("../../helpers");
var rscriptPath = path.resolve('./', 'R', 'useMetabase.R');
//#region original login
router.post('/login', function (req, res) {
    var _a = req.body, storeId = _a.storeId, confidence = _a.confidence, rulesAmount = _a.rulesAmount, byItemName = _a.byItemName, username = _a.username, password = _a.password;
    metabase_1.metabaseLogin(username, password)
        .then(function (result) {
        // if succesful login to metabase
        var mbToken = encodeURIComponent(result.data.id);
        res.redirect(307, "/useMetabase/getRules?mbToken=" + mbToken + "&storeId=" + storeId + "&confidence=" + confidence + "&rulesAmount=" + rulesAmount + "&byItemName=" + byItemName);
    })
        .catch(function (err) { return res.status(500).send(err); });
});
//#endregion
//#region dbs logins
router.post('/login-dbs', function (req, res) {
    var _a = req.body, storeId = _a.storeId, confidence = _a.confidence, rulesAmount = _a.rulesAmount, byItemName = _a.byItemName, username = _a.username, password = _a.password;
    if (username === env.DBS_USER && password === env.DBS_PASS) {
        metabase_1.metabaseLogin(env.METABASE_USER, env.METABASE_PASS)
            .then(function (result) {
            // if succesful login to metabase
            var mbToken = encodeURIComponent(result.data.id);
            res.redirect(307, "/useMetabase/getRules?mbToken=" + mbToken + "&storeId=" + storeId + "&confidence=" + confidence + "&rulesAmount=" + rulesAmount + "&byItemName=" + byItemName);
        })
            .catch(function (err) { return res.status(500).send(err); });
    }
    else {
        res.status(401).send('Wrong password or username'); // handle this in FE
    }
});
router.post('/login-dbs-demo', function (req, res) {
    var _a = req.body, storeId = _a.storeId, username = _a.username, password = _a.password;
    if (username === env.DBS_USER && password === env.DBS_PASS) {
        metabase_1.metabaseLogin(env.METABASE_USER, env.METABASE_PASS)
            .then(function (result) {
            // if succesful login to metabase
            var mbToken = encodeURIComponent(result.data.id);
            console.log(mbToken);
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
    var sqlQuery = metabase_1.constructRulesQuery(byItemName, storeId);
    metabase_1.sendMetabaseQuery(mbToken, sqlQuery, 'csv')
        .then(function (result) {
        fs.mkdir(storeId, { recursive: true }, function (error) {
            if (error) {
                console.log('mkdir error', error);
                res.sendStatus(500);
            }
            fs.writeFile(storeId + "/" + storeId + "-data.csv", result.data, function (err) {
                if (err) {
                    return console.log(err);
                }
                else {
                    helpers_1.callR(rscriptPath, storeId, confidence, rulesAmount, byItemName)
                        .then(function (result) {
                        console.log('finished with callR: ');
                        var rules = helpers_1.convertRulesToJson(storeId);
                        res.status(200).send(rules);
                    })
                        .catch(function (error) {
                        console.log('Finished with callR - error: ', error);
                        res.status(500).send(error);
                    });
                }
            });
        });
    })
        .catch(function (error) {
        console.log('Finished with MB Query - error: ', error);
        res.status(500).send(error);
    });
});
//#endregion
//#region GET Menu items for mock store
router.post('/login-demo', function (req, res) {
    var _a = req.body, storeId = _a.storeId, username = _a.username, password = _a.password;
    metabase_1.metabaseLogin(username, password)
        .then(function (result) {
        // if succesful login to metabase
        var mbToken = encodeURIComponent(result.data.id);
        console.log(mbToken);
        res.redirect(307, "/useMetabase/getMenuItems?mbToken=" + mbToken + "&storeId=" + storeId);
    })
        .catch(function (err) { return res.status(500).send(err); });
});
router.post('/getMenuItems', function (req, res) {
    var mbToken = req.query.mbToken;
    var storeId = req.query.storeId;
    var sqlQuery = metabase_1.constructMenuQuery(storeId);
    metabase_1.sendMetabaseQuery(mbToken, sqlQuery, 'json').then(function (result) {
        var menu = helpers_1.parseMenu(result.data);
        res.status(200).send(menu);
    });
});
//#endregion
//#endregion
module.exports = router;
