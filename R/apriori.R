# rem: with TRUE option below, #args[1] is the "--args" switch; skip it.
args <- commandArgs(TRUE)
storeId <- (args[2])
confidence <- as.numeric((args[3]))
rulesAmount <- as.numeric((args[4]))
rulesById <- (args[5])
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
if(rulesById == 'True') {
sqlQuery(uat_conn, capture.output(cat("EXEC dbo.usp_CreateTempOrdersByStoreTable_itemId @StoreId =", storeId)))
} else {
sqlQuery(uat_conn, capture.output(cat("EXEC dbo.usp_CreateTempOrdersByStoreTable @StoreId =", storeId)))

} 
retail <- sqlQuery(uat_conn, capture.output(cat("SELECT * FROM [flipdishlocal].[dbo].[", storeId, "]", sep="")))

# print('retail:')
# head(retail)

# This groups order items under one order_id and into one column seperated by a comma
# Order_id      Name
# 23423         Chicken Balls, Curry Sauce, Chips
itemList <- ddply(retail, c("OrderId"), function(df1)paste(if(rulesById == 'True') {df1$MenuItemId} else{df1$Name}, collapse = ","))

# drop OrderId column
itemList$OrderId <- NULL

# rename remaining column to items
colnames(itemList) <- c("items")

# write to csv. This will create new column after each comma e.g.
# Items
# Chicken Balls | Curry Sauce | Chips
# Kids Pizza    | Meal Deal 3 | Coke

# use store id here to create unique filename
fn_mba <- capture.output(cat(storeId, "mba.csv", sep="-"))
write.csv(itemList, fn_mba, quote=FALSE, row.names = TRUE)

# convert the csv to correct basket transaction format
# rm.duplicates=TRUE added beacuse it does it anyway, it cant handle quantities witin a transaction so wants to remove duplicates.
# e.g If the item list is Stuffed Auberginea, Stuffed Auberginea, Stuffed Auberginea, Stuffed Auberginea it would be a waste if time returning a rule saying
#{Stuffed Auberginea} => {Stuffed Auberginea}
# imagine suggesting more of the same!
# file name should be storeId
tr <- read.transactions(fn_mba, format = 'basket', sep = ',', rm.duplicates=TRUE)

# create rules with support and confidence values
rules <- apriori(tr, parameter = list(supp=0.001, conf=confidence))
rules <- sort(rules, by='confidence', decreasing = TRUE)

# Statistial summary of the rules - store these
 fn_summary <- capture.output(cat(storeId, "summary.txt", sep="-"))
 summary_rules <- summary(rules)
 capture.output(summary_rules, file=fn_summary)

# the good stuff! Capture the rules
rulesTop10 <- inspect(rules[1:rulesAmount])

# This step is unnecessary, in the next step we convert to JSON and that's all we need.
# write.csv(rulesTop10, 'store_rules.csv', quote=FALSE, row.names = FALSE)

# write json to file, use storeId as name
rules_json <- toJSON(rulesTop10, indent=1, method="C")
fn_rulesJson <- capture.output(cat(storeId, "rules.json", sep="-"))
write(rules_json, file=fn_rulesJson)

# delete mba file
unlink(fn_mba)