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
    let err = false;
    const child = spawn(process.env.RSCRIPT, [
      '--vanilla',
      path,
      '--args',
      storeId,
      confidence,
      rulesAmount,
      byItemName
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

const setupMetabase = async () => {
  try {
    const mbToken = await axios.post(
      'http://localhost:3000/api/session',
      {
        username: 'liam.gardner@protonmail.com',
        password: 'metabase1'
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
  if (byItemName) {
    sqlQuery = `{"database": 2, "type": "native", "native": {"query": "SELECT o.OrderId, mi.MenuItemId FROM PhysicalRestaurants pr JOIN Orders o ON o.PhysicalRestaurantId = pr.PhysicalRestaurantId JOIN OrderItems oi ON oi.Order_OrderId = o.OrderId JOIN MenuItems mi ON mi.MenuItemId = oi.MenuItemId WHERE pr.PhysicalRestaurantId = ${storeId}"}}`;
  } else {
    sqlQuery = `{"database": 2, "type": "native", "native": {"query": "SELECT o.OrderId, mi.Name FROM PhysicalRestaurants pr JOIN Orders o ON o.PhysicalRestaurantId = pr.PhysicalRestaurantId JOIN OrderItems oi ON oi.Order_OrderId = o.OrderId JOIN MenuItems mi ON mi.MenuItemId = oi.MenuItemId WHERE pr.PhysicalRestaurantId = ${storeId}"}}`;
  }

  const url = 'http://localhost:3000/api/dataset/csv';
  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Metabase-Session': mbToken
    }
  };

  try {
    return axios.post(url, qs.stringify({ query: sqlQuery }), config);
  } catch (error) {
    console.log(error);
  }
};

router.post('/login', (req, res) => {
  const { storeId, confidence, rulesAmount, byItemName } = req.body;
  setupMetabase().then(result => {
    const mbToken = encodeURIComponent(result.data);
    res.redirect(
      `/getRules?mbToken=${mbToken}&storeId=${storeId}&confidence=${confidence}&rulesAmount=${rulesAmount}&byItemName=${byItemName}`
    );
  });
});

router.post('/getRules', (req, res) => {
  const { mbToken, storeId, confidence, rulesAmount, byItemName } = req.body;
  sendMetabaseQuery(mbToken, byItemName, storeId)
    .then(() => {
      fs.writeFile(`${storeId}-data.csv`, result.data, err => {
        if (err) return console.log(err);
      });
      callR(rscriptPath, storeId, confidence, rulesAmount)
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
      console.log('Finished with MB Query - error: ', error);
      res.status(500).send(error);
    });
});

module.exports = router;