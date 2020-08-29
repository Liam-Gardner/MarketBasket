"use strict";
var express = require("express");
var router = express.Router();
var path = require("path");
var spawn = require("child_process").spawn;
var fs = require("fs");
require("dotenv").config();
var setupODBC = function () {
    return new Promise(function (resolve, reject) {
        console.log("setting up odbc connection");
        var err = false;
        var bin = 'odbcconf.exe /a {CONFIGDSN "SQL Server Native Client 11.0" "DSN=association_rules_api|SERVER=localhost|Trusted_Connection=Yes|Database=flipdishlocal"}';
        var cliArgs = [];
        var options = {
            spawn: true,
            cwd: 'C:/',
            shell: true,
        };
        var child = spawn(bin, cliArgs, options);
        child.stderr.on("data", function (data) {
            console.log(data.toString());
        });
        child.stdout.on("data", function (data) {
            console.log(data.toString());
        });
        child.on("error", function (error) {
            err = true;
            reject(error);
        });
        child.on("exit", function () {
            if (err)
                return; // debounce - already rejected
            resolve("done."); // TODO: check exit code and resolve/reject accordingly
        });
    });
};
var rscriptPath = path.resolve("./", "R", "apriori.R");
var callR = function (path, storeId, confidence, rulesAmount, rulesById, isDemo, isDemoById) {
    return new Promise(function (resolve, reject) {
        var err = false;
        var child = spawn(process.env.RSCRIPT, [
            "--vanilla",
            path,
            "--args",
            storeId,
            confidence,
            rulesAmount,
            byItemName,
        ]);
        child.stderr.on("data", function (data) {
            console.log(data.toString());
        });
        child.stdout.on("data", function (data) {
            console.log(data.toString());
        });
        child.on("error", function (error) {
            err = true;
            reject(error);
        });
        child.on("exit", function () {
            if (err)
                return; // debounce - already rejected
            resolve("done."); // TODO: check exit code and resolve/reject accordingly
        });
    });
};
var convertRulesToJson = function (storeId, isDemo, rulesById, isDemoById) {
    var data = isDemo == "True"
        ? fs.readFileSync("demo-rules.json", "utf8")
        : fs.readFileSync(storeId + "-rules.json", "utf8");
    var parsedJson = JSON.parse(data);
    // removes {} from lhs and rhs
    var lhs = parsedJson.lhs.map(function (str) { return str.replace(/[{}]/gm, ""); });
    var rhs = parsedJson.rhs.map(function (str) { return str.replace(/[{}]/gm, ""); });
    var keyValPairs = lhs.reduce(function (obj, value, index) {
        // remove Number on rhs if we are going to receive more than one itemid
        obj[value] =
            rulesById === "True" || isDemoById === "True"
                ? Number(rhs[index])
                : rhs[index];
        return obj;
    }, {});
    return keyValPairs;
};
router.post("/test", function (req, res) {
    var _a = req.body, storeId = _a.storeId, confidence = _a.confidence, rulesAmount = _a.rulesAmount, rulesById = _a.rulesById, isDemo = _a.isDemo, isDemoById = _a.isDemoById;
    // create the db connection
    setupODBC()
        .then(function (result) {
        console.log("odbc setup complete ", result);
        console.log("Invoking R script at: ", rscriptPath);
        // execute R code
        callR(rscriptPath, storeId, confidence, rulesAmount, rulesById, isDemo, isDemoById)
            .then(function (result) {
            console.log("finished with callR: ", result);
            var rules = convertRulesToJson(storeId, isDemo, rulesById, isDemoById);
            res.status(200).send(rules);
        })
            .catch(function (error) {
            console.log("Finished with callR - error: ", error);
            res.status(500).send(error);
        });
    })
        .catch(function (error) {
        console.log("Finished with ODBC - error: ", error);
        res.status(500).send(error);
    });
});
// router.post('/trySuperMan', (req, res) => {
//   sendMbQuerySuperMan()
//     .then(result => res.send(result.data).status(200))
//     .catch(err => res.send(err).status(500));
// });
// // if (useMetabase) {
// //   // create metabase connection
// //   setupMetabase()
// //     .then(result => {
// //       // run sql query to return .csv format and pass the filename to R
// //       console.log('metabase setup complete ', result.data);
// //       next();
// //       sendMetabaseQuery()
// //         .then(r => {
// //           // fs.writeFile('metabaseTest.csv', r.data);
// //           res.status(r.data);
// //         })
// //         .catch(error => {
// //           console.log(error);
// //           res.status(500).send(error);
// //         });
// //       // console.log('Invoking R script at: ', rscriptPath);
// //     })
// //     .catch(error => {
// //       console.log('Finished with ODBC - error: ', error);
// //       res.status(500).send(error);
// //     });
// } else {
//   // create the db connection
//   setupODBC()
//     .then(result => {
//       console.log('odbc setup complete ', result);
//       console.log('Invoking R script at: ', rscriptPath);
//       // execute R code
//       callR(rscriptPath, storeId, confidence, rulesAmount, byItemName)
//         .then(result => {
//           console.log('finished with callR: ', result);
//           const rules = convertRulesToJson(storeId);
//           res.status(200).send(rules);
//         })
//         .catch(error => {
//           console.log('Finished with callR - error: ', error);
//           res.status(500).send(error);
//         });
//     })
//     .catch(error => {
//       console.log('Finished with ODBC - error: ', error);
//       res.status(500).send(error);
//     });
//}
// });
module.exports = router;
