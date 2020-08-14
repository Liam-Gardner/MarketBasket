const axios = require('axios').default;
const qs = require('querystring');
const { env } = require('process');
require('dotenv').config();

const metabaseLogin = async (username, password) => {
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

const constructMenuQuery = storeId => {
  return `{"database": 2, "type": "native", "native": {"query": "SELECT mi.Name 
    FROM Menusections ms 
    JOIN Menuitems mi 
    ON ms.Menusectionid = mi.Menusectionid 
    WHERE ms.MenuId =
    (SELECT MenuId 
    FROM PhysicalRestaurants 
    WHERE PhysicalRestaurantId = ${storeId})"}}`;
};

const constructRulesQuery = (byItemName, storeId) => {
  let sqlQuery;
  if (byItemName == 'True') {
    sqlQuery = `{"database": 2, "type": "native", "native": {"query": "SELECT o.OrderId, mi.Name FROM PhysicalRestaurants pr JOIN Orders o ON o.PhysicalRestaurantId = pr.PhysicalRestaurantId JOIN OrderItems oi ON oi.Order_OrderId = o.OrderId JOIN MenuItems mi ON mi.MenuItemId = oi.MenuItemId WHERE pr.PhysicalRestaurantId = ${storeId}"}}`;
  } else {
    sqlQuery = `{"database": 2, "type": "native", "native": {"query": "SELECT o.OrderId, mi.MenuItemId FROM PhysicalRestaurants pr JOIN Orders o ON o.PhysicalRestaurantId = pr.PhysicalRestaurantId JOIN OrderItems oi ON oi.Order_OrderId = o.OrderId JOIN MenuItems mi ON mi.MenuItemId = oi.MenuItemId WHERE pr.PhysicalRestaurantId = ${storeId}"}}`;
  }
  return sqlQuery;
};

const sendMetabaseQuery = async (mbToken, sqlQuery, format) => {
  const url = `${process.env.METABASE_URL}/api/dataset/${format}`;
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

module.exports = { constructMenuQuery, constructRulesQuery, metabaseLogin, sendMetabaseQuery };
