"use strict";
var express = require('express');
var router = express.Router();
var path = require('path');
var spawn = require('child_process').spawn;
var fs = require('fs');
require('dotenv').config();
// create folder test
router.post('/createFolder', function (req, res) {
    //   const fileName = req.body.nameForFile;
    var folderName = req.body.nameForFolder;
    fs.mkdir(folderName, { recursive: true }, function (err) {
        if (err) {
            console.log(err);
            res.sendStatus(500);
        }
        else {
            res.sendStatus(200);
        }
    });
});
// serve static files test
router.get('/serve-static', function (req, res) {
    res.sendFile(path.join(process.cwd() + "/5215/test.html"));
});
//#region test data locally - no metabase calls
var rscriptPath = path.resolve('./', 'R', 'debug.R');
var callR = function (path, storeId, confidence, rulesAmount, byItemName) {
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
router.post('/login', function (req, res) {
    var _a = req.body, storeId = _a.storeId, confidence = _a.confidence, rulesAmount = _a.rulesAmount, byItemName = _a.byItemName;
    console.log('req', req.body);
    res.redirect(307, "/debug/getRules?storeId=" + storeId + "&confidence=" + confidence + "&rulesAmount=" + rulesAmount + "&byItemName=" + byItemName);
});
var convertRulesToJson = function (storeId) {
    var data = fs.readFileSync(storeId + "/" + storeId + "-rules.json", 'utf8');
    var parsedJson = JSON.parse(data);
    // removes {} from lhs and rhs
    // may need to remove "" from key & value if returning menu item id's
    var lhs = parsedJson.lhs.map(function (str) { return str.replace(/[{}]/gm, ''); });
    var rhs = parsedJson.rhs.map(function (str) { return str.replace(/[{}]/gm, ''); });
    console.log('json rules length: ', lhs.length);
    // need to
    var keyValPairs = lhs.reduce(function (obj, value, index) {
        // check if obj[value] exists in obj
        // if true then compare the lift of each and keep the highest
        // or a hacky-ish way. The first key will be the one we want to keep becuz they are already sorted by lift
        var duplicate = Object.keys(obj).find(function (k) { return k === value; });
        if (!duplicate) {
            obj[value] = rhs[index];
        }
        return obj;
    }, {});
    return keyValPairs;
};
router.post('/getRules', function (req, res) {
    var storeId = req.query.storeId;
    var confidence = req.query.confidence;
    var rulesAmount = req.query.rulesAmount;
    var byItemName = req.query.byItemName;
    callR(rscriptPath, storeId, confidence, rulesAmount, byItemName)
        .then(function (result) {
        console.log('finished with callR: ');
        var rules = convertRulesToJson(storeId);
        res.status(200).send(rules);
    })
        .catch(function (error) {
        console.log('Finished with callR - error: ', error);
        res.status(500).send(error);
    });
});
//#endregion
module.exports = router;
