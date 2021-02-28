import * as express from 'express';
const router = express.Router();
const path = require('path');
const { env } = require('process');
require('dotenv').config();
import {
  constructMenuQuery,
  metabaseLogin,
  sendMetabaseQuery,
  constructRulesTimeQuantityQuery,
} from '../../models/metabase';
import {
  checkIfRulesExist,
  convertRulesToJson,
  getRulesR,
  makeDirectory,
  parseMenu,
  writeFile,
} from '../../helpers';

const rscriptRulesPath = path.resolve('./', 'R', 'useMetabase.R');

//#region Login to Metabase then getRules
router.post('/login', async (req, res) => {
  const { storeId, confidence, rulesAmount, byItemName, username, password } = req.body;
  if (username === env.METABASE_USER && password === env.METABASE_PASS) {
    try {
      const result = await metabaseLogin(env.METABASE_USER, env.METABASE_PASS);
      const mbToken = encodeURIComponent(result.data.id);
      res.redirect(
        307,
        `/useMetabase/getRules?mbToken=${mbToken}&storeId=${storeId}&confidence=${confidence}&rulesAmount=${rulesAmount}&byItemName=${byItemName}`
      );
    } catch (err) {
      // IF Metabase is down but you given the correct login we'll let u have the rules if they exist
      const rulesExist = checkIfRulesExist(storeId);
      if (rulesExist) {
        const rules = convertRulesToJson(storeId);
        res.status(200).send({
          rules,
        });
      } else {
        res.status(500).send(err);
      }
    }
  } else {
    res.status(401).send('<h3>Wrong password or username</h3>');
  }
});

// Store demo page
router.post('/login-dbs-demo', (req, res) => {
  const { storeId, username, password } = req.body;
  if (username === env.DBS_USER && password === env.DBS_PASS) {
    metabaseLogin(env.METABASE_USER, env.METABASE_PASS)
      .then(result => {
        const mbToken = encodeURIComponent(result.data.id);
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
router.post('/getRules', async (req, res) => {
  const mbToken = req.query.mbToken as string;
  const storeId = req.query.storeId as string;
  const confidence = req.query.confidence as string;
  const rulesAmount = req.query.rulesAmount as string;
  const byItemName = req.query.byItemName as 'True' | 'False';

  const rulesExist = checkIfRulesExist(storeId);

  if (rulesExist) {
    const rules = convertRulesToJson(storeId);
    res.status(200).send({
      rules,
    });
  } else {
    const sqlQuery = constructRulesTimeQuantityQuery(byItemName, storeId);
    try {
      const { data } = await sendMetabaseQuery(mbToken, sqlQuery, 'csv');
      await makeDirectory(storeId, true);
      await writeFile(`${storeId}/${storeId}-data.csv`, data);
      await getRulesR(rscriptRulesPath, storeId, confidence, rulesAmount, byItemName);
      const rules = convertRulesToJson(storeId);
      res.status(200).send({
        rules,
      });
    } catch (error) {
      console.log('error getting rules', error);
    }
  }
});

//#endregion

//#region GET Menu items for mock store
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
