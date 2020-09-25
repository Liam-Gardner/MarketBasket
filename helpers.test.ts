import { convertRulesToJson, parseMenu } from './helpers';
import { menuItems, Rules, uniqueMenuItems } from './testData/testData';

describe('parse menu checks', () => {
  it('returns unique menu items', () => {
    expect(parseMenu(menuItems)).toStrictEqual(uniqueMenuItems);
  });
});

describe('convert rules to json', () => {
  it('returns unique rules in order', () => {
    expect(convertRulesToJson('test')).toStrictEqual(Rules);
    expect(convertRulesToJson('test')).toHaveLength(11);
  });
});
