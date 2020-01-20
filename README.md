# MarketBasket

# Description
A node server, serving an api that takes in a physicalRestaurantId (Store) and does the following:
1. Connects to the database
2. Performs SQL joins on several tables to get all the order items from that restaurant (Store)
3. Performs SQL query to get the data into the correct format expected by the Apriori alogrithm
4. Converts to .csv (or we figure out how to read SQL in R studio!)
5. Starts an instance of R Studio
6. R Studio knows where rules data is stored /api/rules/physicalRestaurantId/rules.csv
7. Runs code to extract association rules 
8. Returns the rules as a response in JSON format

# Connect to the database

```
USE flipdishlocal
```

# SQL Joins
Example using 2029 as StoreId
```
SELECT pr.Name as StoreName, o.OrderId, oi.Order_OrderId, mi.Name, mi.MenuItemId as mi, oi.MenuItemId, pr.MenuId
INTO OrdersByStore_tmp
FROM PhysicalRestaurants pr
JOIN Orders o ON o.PhysicalRestaurantId = pr.PhysicalRestaurantId
JOIN OrderItems oi ON oi.Order_OrderId = o.OrderId
JOIN MenuItems mi ON mi.MenuItemId = oi.MenuItemId
WHERE pr.PhysicalRestaurantId = 2029
ORDER BY o.OrderId ASC
```

# Apriori Format
```
--join menuitems
SELECT oi.Order_OrderId, mi.Name, oi.MenuItemId
INTO tmp_table
FROM OrdersByStore_tmp oi
JOIN MenuItems mi ON oi.MenuItemId = mi.MenuItemId

-- create Apriori format
-- TODO: swap or add another column with tt2.MenuItemId
SELECT DISTINCT tt2.Order_OrderId,
	SUBSTRING(
		(
			SELECT ','+tt1.Name AS [text()]
			FROM dbo.tmp_table tt1
			WHERE tt1.Order_OrderId = tt2.Order_OrderId
			ORDER BY tt1.Order_OrderId
			FOR XML PATH ('')
		), 2, 1000
	) [OrderItems]
FROM dbo.tmp_table tt2
ORDER BY Order_OrderId
```




