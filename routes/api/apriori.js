const express = require('express');
const router = express.Router();
const path = require('path');
const spawn = require('child_process').spawn;
require('dotenv').config();

const setupODBC = () => {
  return new Promise((resolve, reject) => {
    console.log('setting up odbc connection');
    let err = false;
    let bin =
      'odbcconf.exe /Ld odbc_log.txt /a {CONFIGDSN "SQL Server Native Client 11.0" "DSN=association_rules_api|SERVER=ACER|Trusted_Connection=Yes|Database=Flipdish"}';
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
const callR = (path, storeId) => {
  return new Promise((resolve, reject) => {
    let err = false;
    const child = spawn(process.env.RSCRIPT, [
      '--vanilla',
      path,
      '--args',
      storeId
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
router.post('/test', (req, res, next) => {
  // create the db connection
  setupODBC()
    .then(result => {
      console.log('odbc setup complete ', result);
      console.log('Invoking R script at: ', rscriptPath);
      callR(rscriptPath, req.body.storeId)
        .then(result => {
          console.log('finished with callR: ', result);
          res.status(200).send(result);
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
