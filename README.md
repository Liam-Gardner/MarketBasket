# MarketBasket

# Description

Node Server accepts physicalRestaurantId (Store) and opens an instance of R, passes the storeId to R and runs R script that:

1. Connects to db
2. Runs Stored Procedure to join tables to get all order items from that store and saves to table named after the store id
3. Groups order items under one order_id and saves to csv file, again named after the store Id
4. Converts the csv file to correct basket transaction format
5. Runs Apriori algorithm and returns association rules
6. rules are writtten to a file
7. When the process is finished the node server responfs with the contents of the file or parses it to JSON maybe

# Connect to the database

Setup DB connection on a Windows machine

Replace this with command line script
https://stackoverflow.com/questions/13433371/install-an-odbc-connection-from-cmd-line

1. Create a data source in Windows by opening Data Sources(ODBC)
2. Click Add
3. Select SQL Server Native Client
4. Give the data source a name (UAT in this example)
5. Choose authentication
6. Change default database to flipdishlocal
7. Test connection

In R

```
uat_conn = odbcConnect("UAT")
```

Queries can now be run on the flipdishlocal database
Example

```
sqlQuery(uat_conn, "SELECT * FROM dbo.Orders")
```

# SQL Joins

Example using 2029 as StoreId

```
SELECT o.OrderId, mi.MenuItemId 
FROM PhysicalRestaurants pr 
JOIN Orders o ON o.PhysicalRestaurantId = pr.PhysicalRestaurantId 
JOIN OrderItems oi ON oi.Order_OrderId = o.OrderId 
JOIN MenuItems mi ON mi.MenuItemId = oi.MenuItemId 
WHERE pr.PhysicalRestaurantId = 2029
```

# Apriori Format
THIS IS NOT NEEDED IF USING R CODE WITH APRIORI BUT MAYBE NEEDED IF USING FP-GROWTH

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

# R Code
Line by line explanation
```

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
There may be thousands of rules found so use this to return for example the top 20 rules. Will return all rules if the number is out of bounds.

## byItemName
##### Boolean
The API returns the rules using itemId's. Set this to true if you prefer to have the item names instead.

##### byItemName
```
{
    "Curry Sauce": "Chicken Balls",
    "Chicken Balls": "Curry Sauce",
    "Double Pepperoni Deluxe Pizza": "Coke",
    "Thai Yellow Curry": "Coke",
    "Chicken": "Coke",
    "Regular Burger": "Chips",
    "Hot Dog": "Chilli Sauce",
    "Chilli Sauce": "Hot Dog",
    "Chicken,Thai Yellow Curry": "Coke",
    "Coke,Thai Yellow Curry": "Chicken",
    "Chicken,Coke": "Thai Yellow Curry",
    "Hot Dog,Regular Burger": "Chilli Sauce",
    "Chips,Hot Dog": "Chilli Sauce",
    "Chilli Sauce,Regular Burger": "Hot Dog",
    "Chilli Sauce,Chips": "Regular Burger"
}
```

##### by Id

```
{
    "215": "72",
    "267": "395",
    "395": "267",
    "1473": "4598",
    "4598": "1473",
    "18278,909": "6259",
    "18278,6259": "909",
    "6259,909": "18278",
    "215,267": "395",
    "267,72": "395",
    "215,395": "267",
    "395,72": "267",
    "215,267,72": "395",
    "215,395,72": "267",
    "215,267,395": "72",
    "267,395,72": "215"
}
```