const express = require('express');
const router = express.Router();
const path = require('path');
const spawn = require('child_process').spawn;
const fs = require('fs');
require('dotenv').config();

const setupODBC = () => {
  return new Promise((resolve, reject) => {
    console.log('setting up odbc connection');
    let err = false;
    let bin =
      'odbcconf.exe /a {CONFIGDSN "SQL Server Native Client 11.0" "DSN=association_rules_api|SERVER=localhost|Trusted_Connection=Yes|Database=flipdishlocal"}';
    let cliArgs = [];
    let options = {
      spawn: true,
      cwd: 'C:/',
      shell: true // this or shit breaks!
    };

    const child = spawn(bin, cliArgs, options);
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

const rscriptPath = path.resolve('./', 'R', 'apriori.R');
const callR = (path, storeId, confidence, rulesAmount, rulesById) => {
  return new Promise((resolve, reject) => {
    let err = false;
    const child = spawn(process.env.RSCRIPT, [
      '--vanilla',
      path,
      '--args',
      storeId,
      confidence,
      rulesAmount,
      rulesById
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

const convertRulesToJson = storeId => {
  let data = fs.readFileSync(`${storeId}-rules.json`, 'utf8');
  let parsedJson = JSON.parse(data);

  // removes {} from lhs and rhs
  // may need to remove "" from key & value if returning menu item id's
  let lhs = parsedJson.lhs.map(str => str.replace(/[{}]/gm, ''));
  let rhs = parsedJson.rhs.map(str => str.replace(/[{}]/gm, ''));

  const keyValPairs = lhs.reduce((obj, value, index) => {
    obj[value] = rhs[index];
    return obj;
  }, {});
  return keyValPairs;
};

router.post('/test', (req, res) => {
  // args - storeId, confidence, rulesAmount
  const { storeId, confidence, rulesAmount, rulesById } = req.body;
  // create the db connection
  setupODBC()
    .then(result => {
      console.log('odbc setup complete ', result);
      console.log('Invoking R script at: ', rscriptPath);
      callR(rscriptPath, storeId, confidence, rulesAmount, rulesById)
        .then(result => {
          console.log('finished with callR: ', result);
          const rules = convertRulesToJson(storeId);
          res.status(200).send(rules);
        })
        .catch(error => {
          console.log('Finished with callR - error: ', error);
          res.status(500).send(error);
        });
    })
    .catch(error => {
      console.log('Finished with ODBC - error: ', error);
      res.status(500).send(error);
    });
});

module.exports = router;
