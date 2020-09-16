import * as fs from 'fs';
import { promises as fsPromise } from 'fs';
import { Data, Rule } from './types';
const spawn = require('child_process').spawn;

export const parseMenu = (jsonMenu: { Name: string }[]) => {
  const menuStrings: string = jsonMenu.map(r => Object.values(r)).toString();
  const menuArray = menuStrings.split(',');
  const uniqueItems = [...new Set(menuArray)];
  return uniqueItems;
};

export const convertRulesToJson = (storeId: string): Rule[] => {
  const data = fs.readFileSync(`${storeId}/${storeId}-rules.json`, 'utf8');
  const parsedJson: Data = JSON.parse(data);

  const { support, confidence, lift, count } = parsedJson;
  const lhs: string[] = parsedJson.lhs.map((str: string) => str.replace(/[{}]/gm, ''));
  const rhs: string[] = parsedJson.rhs.map((str: string) => str.replace(/[{}]/gm, ''));

  let rule = {} as Rule;
  let rules = [] as Rule[];
  for (let i = 0; i < parsedJson.lhs.length; i++) {
    rule = {
      lhs: lhs[i],
      rhs: rhs[i],
      support: support[i],
      confidence: confidence[i],
      lift: lift[i],
      count: count[i],
      ruleNumber: i,
    };
    let isDuplicate: boolean = rules.some(obj => obj.lhs === lhs[i]);
    if (!isDuplicate) {
      rules.push(rule);
    }
  }

  return rules;
};

export const getRulesR = (
  path: string,
  storeId: string,
  confidence: string,
  rulesAmount: string,
  byItemName: string
) => {
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
    child.stderr.on('data', (data: any) => {
      console.log(data.toString());
    });
    child.stdout.on('data', (data: any) => {
      console.log(data.toString());
    });
    child.on('error', (error: any) => {
      err = true;
      reject(error);
    });
    child.on('exit', () => {
      if (err) return; // debounce - already rejected
      resolve('done.'); // TODO: check exit code and resolve/reject accordingly
    });
  });
};

export const getPlotsR = (path: string, storeId: string) => {
  return new Promise((resolve, reject) => {
    console.log('callRPlots....');
    let err = false;
    const child = spawn(process.env.RSCRIPT, ['--vanilla', path, '--args', storeId]);
    child.stderr.on('data', (data: any) => {
      console.log(data.toString());
    });
    child.stdout.on('data', (data: any) => {
      console.log(data.toString());
    });
    child.on('error', (error: any) => {
      err = true;
      reject(error);
    });
    child.on('exit', () => {
      if (err) return; // debounce - already rejected
      resolve('done.'); // TODO: check exit code and resolve/reject accordingly
    });
  });
};

export const checkIfRulesExist = (storeId: string) => {
  if (fs.existsSync(`${storeId}/${storeId}-rules.json`)) {
    console.log('The path exists.');
    return true;
  } else {
    return false;
  }
};

export const checkIfPlotsExist = (storeId: string) => {
  if (fs.existsSync(`plots/${storeId}`)) {
    // TODO: check if folder contains images!
    console.log('The path exists.');
    return true;
  } else {
    return false;
  }
};

export const makeDirectory = async (filePath: string, recursive: boolean) => {
  try {
    await fsPromise.mkdir(filePath, { recursive });
  } catch (err) {
    throw err;
  }
};

export const writeFile = async (filePath: string, data: any) => {
  try {
    fsPromise.writeFile(filePath, data);
  } catch (err) {
    throw err;
  }
};

//#region Test data
const testData = {
  lhs: [
    'Trio of Chocolate',
    'White Chocolate and Raspberry Mousse',
    'Chilli Chicken Ramen,Thai Red Curry',
    'Chilli Chicken Ramen,Coca-Cola',
    'Coca-Cola,Thai Red Curry',
  ],
  rhs: [
    'White Chocolate and Raspberry Mousse',
    'Trio of Chocolate',
    'Chicken Egg Fried Rice',
    'Chicken Egg Fried Rice',
    'Chicken Egg Fried Rice',
  ],
  support: [
    0.00115673799884326,
    0.00115673799884326,
    0.00115673799884326,
    0.00115673799884326,
    0.00115673799884326,
  ],
  confidence: [1, 1, 1, 1, 1],
  lift: [864.5, 864.5, 864.5, 864.5, 864.5],
  count: [4, 4, 4, 4, 4],
};
//#endregion
