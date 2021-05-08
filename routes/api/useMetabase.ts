import * as express from 'express';
const router = express.Router();
const path = require('path');
const { env } = require('process');
require('dotenv').config();
import { metabaseLogin, sendMetabaseQuery, constructRulesQuery } from '../../services/metabase';
import {
  checkIfRulesExist,
  convertRulesToJson,
  getRulesR,
  makeDirectory,
  writeFile,
} from '../../helpers';

const rscriptRulesPath = path.resolve('./', 'R', 'useMetabase.R');

//#region Login to Metabase then getRules
router.post('/login', (req, res) => {
  const { storeId, confidence, rulesAmount, username, password } = req.body;
  if (username === env.USER && password === env.PASS) {
    metabaseLogin(env.METABASE_USER, env.METABASE_PASS)
      .then(result => {
        const mbToken = encodeURIComponent(result.data.id);
        res.redirect(
          307,
          `/useMetabase/getRules?mbToken=${mbToken}&storeId=${storeId}&confidence=${confidence}&rulesAmount=${rulesAmount}`
        );
      })
      // IF MB IS DOWN USE THIS CODE!
      .catch(err => {
        const rulesExist = checkIfRulesExist(storeId);
        if (rulesExist) {
          const rules = convertRulesToJson(storeId);
          res.status(200).send({
            rules,
          });
        } else {
          res.status(500).send(err);
        }
      });
  } else {
    res.status(401).send('Wrong password or username'); // TODO: handle this in FE
  }
});

//#region GET RULES
router.post('/getRules', (req, res) => {
  const mbToken = req.query.mbToken as string;
  const storeId = req.query.storeId as string;
  const confidence = req.query.confidence as string;
  const rulesAmount = req.query.rulesAmount as string;

  const rulesExist = checkIfRulesExist(storeId);

  if (rulesExist) {
    const rules = convertRulesToJson(storeId);
    res.status(200).send({
      rules,
    });
  } else {
    const sqlQuery = constructRulesQuery(storeId);
    sendMetabaseQuery(mbToken, sqlQuery, 'csv')
      .then(result => {
        const data = result.data;
        makeDirectory(`rules/${storeId}`, true)
          .then(() => {
            writeFile(`rules/${storeId}/${storeId}-data.csv`, data)
              .then(() => {
                getRulesR(rscriptRulesPath, storeId, confidence, rulesAmount)
                  .then(() => {
                    const rules = convertRulesToJson(storeId);
                    res.status(200).send({
                      rules,
                    });
                  })
                  .catch(error => {
                    console.log('callR - error: ', error);
                    res.status(500).send(error);
                  });
              })
              .catch(error => {
                console.log('storeId writefile error', error);
                res.sendStatus(500);
              });
          })
          .catch(error => {
            console.log('storeId mkDir error', error);
            res.sendStatus(500);
          });
      })
      .catch(error => {
        console.log('MB Query - error: ', error);
        res.status(500).send(error);
      });
  }
});

module.exports = router;
