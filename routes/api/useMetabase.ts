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
  checkIfPlotsExist,
  checkIfRulesExist,
  convertRulesToJson,
  getPlotsR,
  getRulesR,
  makeDirectory,
  parseMenu,
  writeFile,
} from '../../helpers';

const rscriptRulesPath = path.resolve('./', 'R', 'useMetabase.R');
const rscriptPlotsPath = path.resolve('./', 'R', 'getPlots.R');

//#region Login to Metabase then getRules
router.post('/login-dbs', (req, res) => {
  const { storeId, confidence, rulesAmount, byItemName, username, password } = req.body;
  if (username === env.DBS_USER && password === env.DBS_PASS) {
    metabaseLogin(env.METABASE_USER, env.METABASE_PASS)
      .then(result => {
        const mbToken = encodeURIComponent(result.data.id);
        res.redirect(
          307,
          `/useMetabase/getRules?mbToken=${mbToken}&storeId=${storeId}&confidence=${confidence}&rulesAmount=${rulesAmount}&byItemName=${byItemName}`
        );
      })
      .catch(err => res.status(500).send(err));
  } else {
    res.status(401).send('Wrong password or username'); // TODO: handle this in FE
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
router.post('/getRules', (req, res) => {
  const mbToken = req.query.mbToken as string;
  const storeId = req.query.storeId as string;
  const confidence = req.query.confidence as string;
  const rulesAmount = req.query.rulesAmount as string;
  const byItemName = req.query.byItemName as 'True' | 'False';

  const rulesExist = checkIfRulesExist(storeId);
  const plotsExist = checkIfPlotsExist(storeId);

  if (rulesExist) {
    const rules = convertRulesToJson(storeId);
    if (plotsExist) {
      res.status(200).send({
        rules,
        itemsBoughtPlot: `/plots/${storeId}/itemsBoughtPlot.png`,
        popularTimesPlot: `/plots/${storeId}/popularTimesPlot.png`,
        topTenBestSellersPlot: `/plots/${storeId}/topTenBestSellersPlot.png`,
      });
    } else {
      makeDirectory(`plots/${storeId}`, false)
        .then(() => {
          getPlotsR(rscriptPlotsPath, storeId).then(() => {
            res.status(200).send({
              rules,
              itemsBoughtPlot: `/plots/${storeId}/itemsBoughtPlot.png`,
              popularTimesPlot: `/plots/${storeId}/popularTimesPlot.png`,
              topTenBestSellersPlot: `/plots/${storeId}/topTenBestSellersPlot.png`,
            });
          });
        })
        .catch(error => {
          console.log('callRPlots error', error);
          res.sendStatus(500);
        })
        .catch(error => {
          console.log('plots mkdir error', error);
          res.sendStatus(500);
        });
    }
  } else {
    const sqlQuery = constructRulesTimeQuantityQuery(byItemName, storeId);
    sendMetabaseQuery(mbToken, sqlQuery, 'csv')
      .then(result => {
        const data = result.data;
        makeDirectory(storeId, true)
          .then(() => {
            writeFile(`${storeId}/${storeId}-data.csv`, data)
              .then(() => {
                getRulesR(rscriptRulesPath, storeId, confidence, rulesAmount, byItemName)
                  .then(() => {
                    const rules = convertRulesToJson(storeId);
                    makeDirectory(`plots/${storeId}`, false)
                      .then(() => {
                        getPlotsR(rscriptPlotsPath, storeId)
                          .then(() => {
                            res.status(200).send({
                              rules,
                              itemsBoughtPlot: `/plots/${storeId}/itemsBoughtPlot.png`,
                              popularTimesPlot: `/plots/${storeId}/popularTimesPlot.png`,
                              topTenBestSellersPlot: `/plots/${storeId}/topTenBestSellersPlot.png`,
                            });
                          })
                          .catch(error => {
                            console.log('callRPlots error', error);
                            res.sendStatus(500);
                          });
                      })
                      .catch(error => {
                        console.log('plots mkdir error', error);
                        res.sendStatus(500);
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
