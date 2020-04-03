const express = require('express');
const router = express.Router();
const path = require('path');
const spawn = require('child_process').spawn;
const fs = require('fs');
const axios = require('axios').default;
const qs = require('querystring');
require('dotenv').config();
const superagent = require('superagent');

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
      shell: true, // this or shit breaks!
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

const sendMbQuerySuperMan = async () => {
  try {
    const result = await superagent
      .post('http://localhost:3000/api/dataset/csv')
      .query({
        query: {
          database: 2,
          type: 'native',
          native: {
            query: 'SELECT * FROM MenuItems WHERE MenuItemId = 1',
          },
        },
      })
      .set('X-Metabase-Session', 'c77a2b26-c68a-4fa6-b2d3-95d8681c26aa')
      .end((err, res) => {
        if (err) {
          return console.log(err);
        }
        console.log(res.body.url);
        console.log(res.body.explanation);
      });
    return result;
  } catch {
    console.log('error');
    // err => err;
  }
};

const rscriptPath = path.resolve('./', 'R', 'apriori.R');
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
        password: 'metabase1',
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    return mbToken;
  } catch (error) {
    console.log(error);
  }
};
router.post('/test', (req, res, next) => {
  setupMetabase()
    .then(result => {
      console.log(result.data);
      res.send(result.data).status(200);
    })
    .catch(err => res.status(err));
  // const { storeId, confidence, rulesAmount, byItemName } = req.body;
  // let useMetabase = true;###

  // sendMetabaseQuery()
  //   .then(result => {
  //     // fs.writeFile('metabaseTest.csv', result);
  //     res.status(200);
  //   })
  //   .catch(error => {
  //     console.log('\n\n################ERROR#####################: ', error);
  //     res.status(500).send(error);
  //   });
});

const sendMetabaseQuery = async (byItemName, storeId) => {
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
      'X-Metabase-Session': 'c77a2b26-c68a-4fa6-b2d3-95d8681c26aa',
    },
  };

  try {
    return axios.post(url, qs.stringify({ query: sqlQuery }), config);
  } catch (error) {
    console.log(error);
  }
};

router.post('/getData', (req, res, next) => {
  sendMetabaseQuery()
    .then(result => {
      console.log(result);
      // write csv
      fs.writeFile(`${storeId}-data.csv`, result.data, err => {
        if (err) return console.log(err);
      });
      return res.send(result.data);
    })
    .catch(err => {
      console.log(err);
      return res.sendStatus(500);
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
