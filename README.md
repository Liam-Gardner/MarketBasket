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
EXEC dbo.usp_CreateTempOrdersByStoreTable @StoreId = 2029
```

Using MenuItem Name:

```
CREATE PROCEDURE usp_CreateTempOrdersByStoreTable (@StoreId INT)
AS
DECLARE @PhysicalRestaurantId NVARCHAR(10) = CAST(@StoreId AS NVARCHAR(10));
DECLARE @DROP_TABLE NVARCHAR(MAX) = N'DROP TABLE IF EXISTS [flipdishlocal].[dbo].' + QUOTENAME(@PhysicalRestaurantId)
DECLARE @SQL NVARCHAR(MAX) = N'
SELECT o.OrderId, mi.Name
INTO ' + QUOTENAME(@PhysicalRestaurantId) + '
FROM PhysicalRestaurants pr
JOIN Orders o ON o.PhysicalRestaurantId = pr.PhysicalRestaurantId
JOIN OrderItems oi ON oi.Order_OrderId = o.OrderId
JOIN MenuItems mi ON mi.MenuItemId = oi.MenuItemId
WHERE pr.PhysicalRestaurantId = ' + (@PhysicalRestaurantId);

EXEC(@DROP_TABLE)
EXEC(@SQL)
```

Using MenuItem Id:

```
CREATE PROCEDURE usp_CreateTempOrdersByStoreTable_itemId (@StoreId INT)
AS
DECLARE @PhysicalRestaurantId NVARCHAR(10) = CAST(@StoreId AS NVARCHAR(10));
DECLARE @DROP_TABLE NVARCHAR(MAX) = N'DROP TABLE IF EXISTS [flipdishlocal].[dbo].' + QUOTENAME(@PhysicalRestaurantId)
DECLARE @SQL NVARCHAR(MAX) = N'
SELECT o.OrderId, mi.MenuItemId
INTO ' + QUOTENAME(@PhysicalRestaurantId) + '
FROM PhysicalRestaurants pr
JOIN Orders o ON o.PhysicalRestaurantId = pr.PhysicalRestaurantId
JOIN OrderItems oi ON oi.Order_OrderId = o.OrderId
JOIN MenuItems mi ON mi.MenuItemId = oi.MenuItemId
WHERE pr.PhysicalRestaurantId = ' + (@PhysicalRestaurantId);

EXEC(@DROP_TABLE)
EXEC(@SQL)
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

```

# rem: with TRUE option below, #args[1] is the "--args" switch; skip it.
args <- commandArgs(TRUE)
storeId <- (args[2])
print(args)

# checks if package is installed and then installs
usePackage <- function(p) {
  if (!is.element(p, installed.packages()[,1])) {
    install.packages(p, dep = TRUE, repos = "http://cran.us.r-project.org")
  }
  require(p, character.only = TRUE)
}


# load libraries
usePackage('RODBC')
usePackage('tidyverse')
usePackage('readxl')
usePackage('knitr')
usePackage('ggplot2')
usePackage('lubridate')
usePackage('arules')
usePackage('arulesViz')
usePackage('plyr')
usePackage('rjson')

# connect to db
uat_conn = odbcConnect("association_rules_api")


# Join tables using stored proc.
sqlQuery(uat_conn, capture.output(cat("EXEC dbo.usp_CreateTempOrdersByStoreTable @StoreId =", storeId)))
retail <- sqlQuery(uat_conn, capture.output(cat("SELECT * FROM [flipdishlocal].[dbo].[", storeId, "]", sep="")))

print('retail:')
head(retail)

# This groups order items under one order_id and into one column seperated by a comma
# Order_id      Name
# 23423         Chicken Balls, Curry Sauce, Chips
itemList <- ddply(retail, c("OrderId"), function(df1)paste(df1$Name, collapse = ","))

# drop OrderId column
itemList$OrderId <- NULL

# rename remaining column to items
colnames(itemList) <- c("items")

# write to csv. This will create new column after each comma e.g.
# Items
# Chicken Balls | Curry Sauce | Chips
# Kids Pizza    | Meal Deal 3 | Coke

# use store id here to create unique filename
write.csv(itemList, "mba.csv", quote=FALSE, row.names = TRUE)

# convert the csv to correct basket transaction format
# rm.duplicates=TRUE added beacuse it does it anyway, it cant handle quantities witin a transaction so wants to remove duplicates.
# e.g If the item list is Stuffed Auberginea, Stuffed Auberginea, Stuffed Auberginea, Stuffed Auberginea it would be a waste if time returning a rule saying
#{Stuffed Auberginea} => {Stuffed Auberginea}
# imagine suggesting more of the same!
# file name should be storeId
tr <- read.transactions("mba.csv", format = 'basket', sep = ',', rm.duplicates=TRUE)

# create rules with support and confidence values
rules <- apriori(tr, parameter = list(supp=0.001, conf=0.8))
rules <- sort(rules, by='confidence', decreasing = TRUE)

# List summary of rules - may be good to store these in a log file so we can confirm everything is good
summary(rules)

# the good stuff! First shows all rules, the second shows top 10
inspect(rules)
rulesTop10 <- inspect(rules[1:10])

# This step is unnecessary, in the next step we convert to JSON and that's all we need.
# write.csv(rulesTop10, 'store_rules.csv', quote=FALSE, row.names = FALSE)

# write json to file, use storeId as name
rules_json <- toJSON(rulesTop10, indent=1, method="C")
write(rules_json, file="rules.json")


```

# Front End Example
```
const getRecommendedItem = (rules, selectedItem) => {
	let recommendedItem = rules[selectedItem]
	if(recommendedItem){
		return recommendedItem
		}
	else{return null}
} 
```

# Get Columns Names
## Use this to make the service more generic
```
CREATE PROC usp_getTableColumnNames @TABLE_NAME varchar(max), @SCHEMA varchar(max)
AS
BEGIN
	SELECT COLUMN_NAME,* 
	FROM INFORMATION_SCHEMA.COLUMNS
	WHERE TABLE_NAME = @TABLE_NAME AND TABLE_SCHEMA=@SCHEMA
END


EXEC usp_getTableColumnNames @TABLE_NAME = 'Orders', @SCHEMA = 'dbo'
```

## Known Issues
# Missing Rules
If you receive less rules than expected it is likely that there are 2 keys that are the same when the lhs and the rhs arrays have passed through the reduce function. The first key and value will be stored in the object but its value will be overwritten if a key with the same name is added later in the function.

# Fale Rules
IF an menuitem name is seperated by commas like this : 'Sweet and Sour Chicken, Prawn or Tofu and Veg', a rule will be found that says 
	{"Sweet and Sour Chicken" => "Prawn or Tofu and Veg"}

The pre processing trys to break up the multilple order items in an order by comma. If the order is:
Sweet and Sour Chicken, Prawn or Tofu and Veg
Chips
Coke

It will be stored as  | Sweet and Sour Chicken | Prawn or Tofu and Veg | Chips | Coke

This is wrong. Sweet and Sour Chicken, Prawn or Tofu and Veg should be treated as one item.

This won't happen when requesting menu item id's from the API 