# MarketBasket

# Description

This is an api running on Node that returns asssociation rules and graphs for a given restaurant in the Flipdish database via a read only copy of the database accesed through Metabase.

# Flow:

1. User enters metabase login details

2. User enters storeId, confidence, rulesAmount, byItemName parameters

3. Upon succesful login user is redirected to getRules route

4. We send a SQL query to metabase to join the right tables so that we get a dataset back containing the OrderId and OrderItem column.

5. Metabase returns a .csv file with the dataset and we create a folder on the server using the storeId as its name as well as storing the dataset inside, also using the storeId.

6. Next we pass the storeId, confidence, rulesAmount, byItemName parameters to a function that will invoke an instance of R.

7. The R script will first install the necessary pacakges for assoication rules and visualisation. ('arules', 'arulesViz', 'tidyverse', etc.)

8. We then group each order item under their relevant order id so that it can be stored as a transaction object.

9. Now that it is in the correct format we can mine the data for association rules using the Apriori alogrithm.

10. Once the alogrithm is complete we return the data as a JSON object to our Node server.

11. Next we get 3 plots from our data using R - namely 'Busiest Hours', 'Best Selling Items', and 'How many items each customer buys'

12. We can now return the rules and plots to the client.

# SQL Joins

Example using 2029 as StoreId

```
SELECT o.OrderId, mi.Name, mi.MenuItemId, o.TsOrderPlaced, oi.MenuItemId, COUNT(*) as 'Quantity'
FROM PhysicalRestaurants pr
JOIN Orders o ON o.PhysicalRestaurantId = pr.PhysicalRestaurantId
JOIN OrderItems oi ON oi.Order_OrderId = o.OrderId
JOIN MenuItems mi ON mi.MenuItemId = oi.MenuItemId
WHERE pr.PhysicalRestaurantId = 2029
GROUP BY o.OrderId, mi.Name, mi.MenuItemId, o.TsOrderPlaced, oi.MenuItemId
```

# API

## storeId

##### String

The physical restaraunt ID. Used in the SQL query and to dynamically name the rules and summary files.

## confidence

##### Number

Specify the level of confidence you want for the rules that are returned. The higher the confidence the more likely a correct item will be suggested.

## rulesAmount

##### Number

There may be thousands of rules found so use this to return, for example, the top 20 rules. Will return all rules if the number is out of bounds.

## byItemName

##### Boolean

The API returns the rules using itemId's. Set this to true if you prefer to have the item names instead.

## Response

### rules

```
 rules: [
  {
    number: 1,
    lhs: 'Trio of Chocolate',
    rhs: 'White Chocolate and Raspberry Mousse',
    support: 0.00115673799884326,
    confidence: 1,
    lift: 864.5,
    count: 4,
  },
  {
    number: 2,
    lhs: 'White Chocolate and Raspberry Mousse',
    rhs: 'Trio of Chocolate',
    support: 0.00115673799884326,
    confidence: 1,
    lift: 864.5,
    count: 4,
  },
  {
    number: 3,
    lhs: 'Chilli Chicken Ramen,Thai Red Curry',
    rhs: 'Chicken Egg Fried Rice',
    support: 0.00115673799884326,
    confidence: 1,
    lift: 864.5,
    count: 4,
  },
 ]
```

### plots

```
itemsBoughtPlot: "/plots/2029/itemsBoughtPlot.png"
popularTimesPlot: "/plots/2029/popularTimesPlot.png"
topTenBestSellersPlot: "/plots/2029/topTenBestSellersPlot.png"
```

# Known Issues

## Missing Rules

If you receive less rules than expected it is likely that there are 2 keys that are the same when the lhs and the rhs arrays have passed through the reduce function. The first key and value will be stored in the object but its value will be overwritten if a key with the same name is added later in the function.
The rule with the <b>greater lift will win out.</b>

## Rules by item name

IF an menuitem name is seperated by commas like this : 'Sweet and Sour Chicken, Prawn or Tofu and Veg', a rule will be found that says
{"Sweet and Sour Chicken" => "Prawn or Tofu and Veg"}

The pre processing trys to break up multilple order items in an order by comma. If the order is:
Sweet and Sour Chicken, Prawn or Tofu and Veg
Chips
Coke

It will be stored as | Sweet and Sour Chicken | Prawn or Tofu and Veg | Chips | Coke

This is wrong. Sweet and Sour Chicken, Prawn or Tofu and Veg should be treated as one item.

This won't happen when requesting menu item id's from the API
