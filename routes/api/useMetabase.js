const express = require('express');
const router = express.Router();
const path = require('path');
const spawn = require('child_process').spawn;
const fs = require('fs');
const axios = require('axios').default;
const qs = require('querystring');
require('dotenv').config();

const rscriptPath = path.resolve('./', 'R', 'useMetabase.R');
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

    let duplicate = Object.keys(obj).find(k => k === value);
    if (!duplicate) {
      obj[value] = rhs[index];
    }

    return obj;
  }, {});
  return keyValPairs;
};

const setupMetabase = async (username, password) => {
  try {
    const mbToken = await axios.post(
      `${process.env.METABASE_URL}/api/session`,
      {
        username: username,
        password: password,
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    return mbToken;
  } catch (error) {
    console.log(error);
  }
};

const sendMetabaseQuery = async (mbToken, byItemName, storeId) => {
  let sqlQuery;
  if (byItemName == 'True') {
    sqlQuery = `{"database": 2, "type": "native", "native": {"query": "SELECT o.OrderId, mi.Name FROM PhysicalRestaurants pr JOIN Orders o ON o.PhysicalRestaurantId = pr.PhysicalRestaurantId JOIN OrderItems oi ON oi.Order_OrderId = o.OrderId JOIN MenuItems mi ON mi.MenuItemId = oi.MenuItemId WHERE pr.PhysicalRestaurantId = ${storeId}"}}`;
  } else {
    sqlQuery = `{"database": 2, "type": "native", "native": {"query": "SELECT o.OrderId, mi.MenuItemId FROM PhysicalRestaurants pr JOIN Orders o ON o.PhysicalRestaurantId = pr.PhysicalRestaurantId JOIN OrderItems oi ON oi.Order_OrderId = o.OrderId JOIN MenuItems mi ON mi.MenuItemId = oi.MenuItemId WHERE pr.PhysicalRestaurantId = ${storeId}"}}`;
  }

  const url = `${process.env.METABASE_URL}/api/dataset/csv`;
  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Metabase-Session': mbToken,
    },
  };

  try {
    return axios.post(url, qs.stringify({ query: sqlQuery }), config);
  } catch (error) {
    console.log(error);
  }
};

router.post('/login', (req, res) => {
  const { storeId, confidence, rulesAmount, byItemName, username, password } = req.body;
  setupMetabase(username, password)
    .then(result => {
      // if succesful login to metabase
      const mbToken = encodeURIComponent(result.data.id);
      res.redirect(
        307,
        `/useMetabase/getRules?mbToken=${mbToken}&storeId=${storeId}&confidence=${confidence}&rulesAmount=${rulesAmount}&byItemName=${byItemName}`
      );
    })
    .catch(err => res.status(500).send(err));
});

router.post('/getRules', (req, res) => {
  const mbToken = req.query.mbToken;
  const storeId = req.query.storeId;
  const confidence = req.query.confidence;
  const rulesAmount = req.query.rulesAmount;
  const byItemName = req.query.byItemName;

  sendMetabaseQuery(mbToken, byItemName, storeId)
    .then(result => {
      fs.mkdir(storeId, { recursive: true }, error => {
        if (error) {
          console.log('mkdir error', error);
          res.sendStatus(500);
        }
        fs.writeFile(`${storeId}/${storeId}-data.csv`, result.data, err => {
          if (err) {
            return console.log(err);
          } else {
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
          }
        });
      });
    })
    .catch(error => {
      console.log('Finished with MB Query - error: ', error);
      res.status(500).send(error);
    });
});

module.exports = router;
