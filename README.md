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
EXEC dbo.usp_CreateTempOrdersByStoreTable @StoreId = 2029
```

Using MenuItem Name:
```
CREATE PROCEDURE usp_CreateTempOrdersByStoreTable @StoreId INT
AS
SELECT o.OrderId, mi.Name
INTO OrdersByStore_tmp
FROM PhysicalRestaurants pr
JOIN Orders o ON o.PhysicalRestaurantId = pr.PhysicalRestaurantId
JOIN OrderItems oi ON oi.Order_OrderId = o.OrderId
JOIN MenuItems mi ON mi.MenuItemId = oi.MenuItemId
WHERE pr.PhysicalRestaurantId = @StoreId
ORDER BY o.OrderId ASC
GO
```

Using MenuItem Id:
```
CREATE PROCEDURE usp_CreateTempOrdersByStoreTable @StoreId INT
AS
SELECT o.OrderId, mi.MenuItemId
INTO OrdersByStore_tmp
FROM PhysicalRestaurants pr
JOIN Orders o ON o.PhysicalRestaurantId = pr.PhysicalRestaurantId
JOIN OrderItems oi ON oi.Order_OrderId = o.OrderId
JOIN MenuItems mi ON mi.MenuItemId = oi.MenuItemId
WHERE pr.PhysicalRestaurantId = @StoreId
ORDER BY o.OrderId ASC
GO
```



# Apriori Format
```
EXEC dbo.usp_CreateAprioriFormat
```

```
CREATE PROC usp_CreateAprioriFormat
AS
SELECT DISTINCT tt2.OrderId,
	SUBSTRING(
		(
			SELECT ','+tt1.Name AS [text()]
			FROM OrdersByStore_tmp tt1
			WHERE tt1.OrderId = tt2.OrderId
			ORDER BY tt1.OrderId
			FOR XML PATH ('')
		), 2, 1000
	) [OrderItems]
	INTO ap_tmp
FROM OrdersByStore_tmp tt2
ORDER BY OrderId
GO
```


