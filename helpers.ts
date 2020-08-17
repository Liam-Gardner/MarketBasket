import * as fs from 'fs';

const spawn = require('child_process').spawn;

export const parseMenu = (jsonMenu: string[]) => {
  const menuStrings: string = jsonMenu.map(r => Object.values(r)).toString();
  const menuArray = menuStrings.split(',');
  const uniqueItems = [...new Set(menuArray)];
  return uniqueItems;
};

export const convertRulesToJson = (storeId: string) => {
  let data = fs.readFileSync(`${storeId}/${storeId}-rules.json`, 'utf8');
  let parsedJson = JSON.parse(data);

  // removes {} from lhs and rhs
  // may need to remove "" from key & value if returning menu item id's
  let lhs = parsedJson.lhs.map((str: string) => str.replace(/[{}]/gm, ''));
  let rhs = parsedJson.rhs.map((str: string) => str.replace(/[{}]/gm, ''));

  console.log('json rules length: ', lhs.length);
  // need to

  const keyValPairs = lhs.reduce((obj: any, value: any, index: number) => {
    // check if obj[value] exists in obj
    // if true then compare the lift of each and keep the highest
    // or a hacky-ish way. The first key will be the one we want to keep becuz they are already sorted by lift

    let duplicate = Object.keys(obj).find(k => k === value);
    if (!duplicate) {
      obj[value] = rhs[index];
    }

    return obj;
  }, {});
  return keyValPairs;
};

export const callR = (
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
