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



# receive store Id from node


# connect to db 
uat_conn = odbcConnect("UAT")


# Join tables using stored proc. 2029 should be replaced by store id here 
retail <- sqlQuery(uat_conn, "EXEC dbo.usp_CreateTempOrdersByStoreTable @StoreId = 2029")

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
# use store id here to cretae unique filename
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
rulesTop10 <- inspect(rules[1:10])

# return the rules somehow, try csv first but maybe JSON, also name file by store ID or store name later
wtite.csv(rulesTop10, 'store_rules.csv', quote=FALSE, row.names = FALSE)