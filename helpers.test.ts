import { parseMenu } from './helpers';

const menuItems = [
  { Name: 'Chicken Burger Meal' },
  { Name: 'Cod Meal Deal' },
  { Name: 'Chicken Burger Meal' },
  { Name: 'Chicken Burger Meal' },
  { Name: 'The Spicy Pitta' },
  { Name: 'Cod Meal Deal' },
  { Name: 'Cod Meal Deal' },
];

const uniqueMenuItems = ['Chicken Burger Meal', 'Cod Meal Deal', 'The Spicy Pitta'];

describe('parse menu checks', () => {
  test('returns unique menu items', () => {
    expect(parseMenu(menuItems)).toStrictEqual(uniqueMenuItems);
  });
});
