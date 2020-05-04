const express = require('express');
const router = express.Router();
const path = require('path');
const spawn = require('child_process').spawn;
const fs = require('fs');
require('dotenv').config();

// create folder test
router.post('/createFolder', (req, res) => {
  //   const fileName = req.body.nameForFile;
  const folderName = req.body.nameForFolder;
  fs.mkdir(folderName, { recursive: true }, err => {
    if (err) {
      console.log(err);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
});

// serve static files test
router.get('/serve-static', (req, res) => {
  res.sendFile(path.join(process.cwd() + `/5215/test.html`));
});

//#region test data locally - no metabase calls
const rscriptPath = path.resolve('./', 'R', 'debug.R');
const callR = (path, storeId, confidence, rulesAmount, byItemName) => {
  return new Promise((resolve, reject) => {
    console.log('callR....');
    let err = false;
    const child = spawn(process.env.RSCRIPT, [
      '--vanilla',
      path,
      '--args',
      storeId,
      confidence,
      rulesAmount,
      byItemName,
    ]);
    child.stderr.on('data', data => {
      console.log(data.toString());
    });
    child.stdout.on('data', data => {
      console.log(data.toString());
    });
    child.on('error', error => {
      err = true;
      reject(error);
    });
    child.on('exit', () => {
      if (err) return; // debounce - already rejected
      resolve('done.'); // TODO: check exit code and resolve/reject accordingly
    });
  });
};

router.post('/login', (req, res) => {
  const { storeId, confidence, rulesAmount, byItemName } = req.body;
  console.log('req', req.body);
  res.redirect(
    307,
    `/debug/getRules?storeId=${storeId}&confidence=${confidence}&rulesAmount=${rulesAmount}&byItemName=${byItemName}`
  );
});

const convertRulesToJson = storeId => {
  let data = fs.readFileSync(`${storeId}/${storeId}-rules.json`, 'utf8');
  let parsedJson = JSON.parse(data);

  // removes {} from lhs and rhs
  // may need to remove "" from key & value if returning menu item id's
  let lhs = parsedJson.lhs.map(str => str.replace(/[{}]/gm, ''));
  let rhs = parsedJson.rhs.map(str => str.replace(/[{}]/gm, ''));

  console.log('json rules length: ', lhs.length);
  // need to

  const keyValPairs = lhs.reduce((obj, value, index) => {
    // check if obj[value] exists in obj
    // if true then compare the lift of each and keep the highest
    // or a hacky-ish way. The first key will be the one we want to keep becuz they are already sorted by lift

    //TODO: Test this
    let duplicate = Object.keys(obj).find(k => k === obj[value]);
    if (duplicate) {
      console.log('duplicate', duplicate);
      return;
    }

    obj[value] = rhs[index];
    return obj;
  }, {});
  return keyValPairs;
};

router.post('/getRules', (req, res) => {
  const storeId = req.query.storeId;
  const confidence = req.query.confidence;
  const rulesAmount = req.query.rulesAmount;
  const byItemName = req.query.byItemName;

  callR(rscriptPath, storeId, confidence, rulesAmount, byItemName)
    .then(result => {
      console.log('finished with callR: ');
      const rules = convertRulesToJson(storeId);
      res.status(200).send(rules);
    })
    .catch(error => {
      console.log('Finished with callR - error: ', error);
      res.status(500).send(error);
    });
});
//#endregion

module.exports = router;
