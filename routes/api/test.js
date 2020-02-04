const express = require("express");
const router = express.Router();
const path = require("path");
const spawn = require("child_process").spawn;
const fs = require("fs");
require("dotenv").config();

const convertRulesToJson = async () => {
  return await fs.readFile("rules.json", "utf8", (err, data) => {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    let rulesJson = data;
    let parsedJson = JSON.parse(rulesJson);
    let lhs = parsedJson.lhs;
    let rhs = parsedJson.rhs;
    const keyValPairs = lhs.reduce((obj, value, index) => {
      obj[value] = rhs[index];
      return obj;
    }, {});
    return keyValPairs;
  });
};

router.post("/test-json", (req, res, next) => {
  convertRulesToJson().then((data) => console.log(data))
  res.status(200).send(data);
});

module.exports = router;
