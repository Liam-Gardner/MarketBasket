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
Setup DB connection on a Windows machine
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
THIS IS NOT NEEDED IF USING R CODE TO DO SAME
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
```
# load libraries
library(tidyverse)
library(readxl)
library(knitr)
library(ggplot2)
library(lubridate)
library(arules)
library(arulesViz)
library(plyr)
library(RODBC)

# connect to db 
uat_conn = odbcConnect("UAT")

# tmp_table = joined 
retail <- sqlQuery(uat_conn, "SELECT * FROM OrdersByStore_tmp") # this table should be dynamically created from the store id if pos

# not sure if this step is needed, investigate
retail_sorted <- retail[order(retail$Order_OrderId),]

# This groups order items under one order_id and into one column seperated by a comma
# Order_id      Name
# 23423         Chicken Balls, Curry Sauce, Chips
itemList <- ddply(retail, c("Order_OrderId"), function(df1)paste(df1$Name, collapse = ","))

# drop OrderId column
itemList$Order_OrderId <- NULL
# rename remaiing column to items
colnames(itemList) <- c("items")

# write to csv. This will create new column after each comma e.g.
# Items
# Chicken Balls | Curry Sauce | Chips
# Kids Pizza    | Meal Deal 3 | Coke
write.csv(itemList, "mba.csv", quote=FALSE, row.names = TRUE)

# convert the csv to correct basket transaction format
tr <- read.transactions("mba.csv", format = 'basket', sep = ',')

# create rules with support and confidence values
rules <- apriori(tr, parameter = list(supp=0.001, conf=0.8))
rules <- sort(rules, by='confidence', decreasing = TRUE)

# List summary of rules - may be good to store these in a log file so we can confirm everything is good
summary(rules)

# the good stuff! First shows all rules, the second shows top 10
inspect(rules)
inspect(rules[1:10])

```

