import { MetaBaseQueryFormat } from '../types';

const axios = require('axios').default;
const qs = require('querystring');
require('dotenv').config();

export const metabaseLogin = async (username: string, password: string) => {
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

export const constructMenuQuery = (storeId: string) => {
  return `{"database": 2, "type": "native", "native": {"query": "SELECT mi.Name 
    FROM Menusections ms 
    JOIN Menuitems mi 
    ON ms.Menusectionid = mi.Menusectionid 
    WHERE ms.MenuId =
    (SELECT MenuId 
    FROM PhysicalRestaurants 
    WHERE PhysicalRestaurantId = ${storeId})"}}`;
};

export const constructRulesTimeQuantityQuery = (byItemName: 'True' | 'False', storeId: string) => {
  let sqlQuery;
  if (byItemName == 'True') {
    sqlQuery = `{"database": 2, "type": "native", "native": {"query": "SELECT o.OrderId, mi.Name, oi.MenuItemId FROM PhysicalRestaurants pr JOIN Orders o ON o.PhysicalRestaurantId = pr.PhysicalRestaurantId JOIN OrderItems oi ON oi.Order_OrderId = o.OrderId JOIN MenuItems mi ON mi.MenuItemId = oi.MenuItemId WHERE pr.PhysicalRestaurantId = ${storeId}"}}`;
  } else {
    // why mi.MenuItemId here and above oi.MenuItemId ?
    sqlQuery = `{"database": 2, "type": "native", "native": {"query": "SELECT o.OrderId, mi.Name, mi.MenuItemId ,oi.MenuItemId FROM PhysicalRestaurants pr JOIN Orders o ON o.PhysicalRestaurantId = pr.PhysicalRestaurantId JOIN OrderItems oi ON oi.Order_OrderId = o.OrderId JOIN MenuItems mi ON mi.MenuItemId = oi.MenuItemId WHERE pr.PhysicalRestaurantId = ${storeId} "}}`;
  }
  return sqlQuery;
};

export const sendMetabaseQuery = async (
  mbToken: string,
  sqlQuery: string,
  format: MetaBaseQueryFormat
) => {
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
    console.log('sendMetabaseQuery', error);
  }
};
