import * as express from 'express';
const router = express.Router();
const path = require('path');
const { env } = require('process');

import * as fs from 'fs';
require('dotenv').config();
import {
  constructMenuQuery,
  constructRulesQuery,
  metabaseLogin,
  sendMetabaseQuery,
} from '../../models/metabase';
import { callR, convertRulesToJson, parseMenu, checkIfRulesExist } from '../../helpers';

const rscriptPath = path.resolve('./', 'R', 'useMetabase.R');

//#region original login
router.post('/login', (req, res) => {
  const { storeId, confidence, rulesAmount, byItemName, username, password } = req.body;
  metabaseLogin(username, password)
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
//#endregion

//#region dbs logins
router.post('/login-dbs', (req, res) => {
  const { storeId, confidence, rulesAmount, byItemName, username, password } = req.body;
  if (username === env.DBS_USER && password === env.DBS_PASS) {
    metabaseLogin(env.METABASE_USER, env.METABASE_PASS)
      .then(result => {
        // if succesful login to metabase
        const mbToken = encodeURIComponent(result.data.id);
        res.redirect(
          307,
          `/useMetabase/getRules?mbToken=${mbToken}&storeId=${storeId}&confidence=${confidence}&rulesAmount=${rulesAmount}&byItemName=${byItemName}`
        );
      })
      .catch(err => res.status(500).send(err));
  } else {
    res.status(401).send('Wrong password or username'); // handle this in FE
  }
});

router.post('/login-dbs-demo', (req, res) => {
  const { storeId, username, password } = req.body;
  if (username === env.DBS_USER && password === env.DBS_PASS) {
    metabaseLogin(env.METABASE_USER, env.METABASE_PASS)
      .then(result => {
        // if succesful login to metabase
        const mbToken = encodeURIComponent(result.data.id);
        console.log(mbToken);
        res.redirect(307, `/useMetabase/getMenuItems?mbToken=${mbToken}&storeId=${storeId}`);
      })
      .catch(err => res.status(500).send(err));
  } else {
    res.status(401).send('Wrong password or username'); // handle this in FE
  }
});
//#endregion

//#region main redirected routes
//#region GET RULES
router.post('/getRules', (req, res) => {
  const mbToken = req.query.mbToken as string;
  const storeId = req.query.storeId as string;
  const confidence = req.query.confidence as string;
  const rulesAmount = req.query.rulesAmount as string;
  const byItemName = req.query.byItemName as 'True' | 'False';

  const rulesExist = checkIfRulesExist(storeId);
  if (rulesExist) {
    const rules = convertRulesToJson(storeId);
    res.status(200).send(rules);
  } else {
    console.log('lets go to metabase!');
    const sqlQuery = constructRulesQuery(byItemName, storeId);
    sendMetabaseQuery(mbToken, sqlQuery, 'csv')
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
  }
});
//#endregion

//#region GET Menu items for mock store
router.post('/login-demo', (req, res) => {
  const { storeId, username, password } = req.body;
  metabaseLogin(username, password)
    .then(result => {
      // if succesful login to metabase
      const mbToken = encodeURIComponent(result.data.id);
      console.log(mbToken);
      res.redirect(307, `/useMetabase/getMenuItems?mbToken=${mbToken}&storeId=${storeId}`);
    })
    .catch(err => res.status(500).send(err));
});

router.post('/getMenuItems', (req, res) => {
  const mbToken = req.query.mbToken as string;
  const storeId = req.query.storeId as string;
  const sqlQuery = constructMenuQuery(storeId);
  sendMetabaseQuery(mbToken, sqlQuery, 'json')
    .then(result => {
      const menu = parseMenu(result.data);
      res.status(200).send(menu);
    })
    .catch(err => res.status(500).send(err));
});

//#endregion
//#endregion
module.exports = router;
