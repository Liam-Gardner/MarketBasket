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
      number: i + 1,
      lhs: lhs[i],
      rhs: rhs[i],
      lift: lift[i],
      confidence: confidence[i],
      count: count[i],
      support: support[i],
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
  // TODO: rewrite as async
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

export const checkIfRulesExist = (storeId: string) => {
  //TODO: add timelimit / override here so we can always get the latest rules if required
  if (fs.existsSync(`${storeId}/${storeId}-rules.json`)) {
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
