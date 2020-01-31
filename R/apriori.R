# handline commandline args... 
# rem: with TRUE option below, #args[1] is the "--args" switch; skip it.
args <- commandArgs(TRUE)
storeId <- (args[2])
print('R script args recieved from Node: ', args)

# cat(paste0("setting working dir from ", 
#            getwd(), 
#            "to : ", 
#            BASEDIR))
# setwd(BASEDIR)

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

# # connect to db 
uat_conn = odbcConnect("association_rules_api")

# # Join tables using stored proc. 2029 should be replaced by store id here 
retail <- sqlQuery(uat_conn, capture.output(cat("EXEC dbo.usp_CreateTempOrdersByStoreTable @StoreId =", storeId)))

# # not sure if this step is needed, investigate
# # $ operator is invalid for atomic vectors https://stackoverflow.com/questions/23299684/r-error-in-xed-operator-is-invalid-for-atomic-vectors
retail_sorted <- retail[order(retail[OrderId]),]

# # This groups order items under one order_id and into one column seperated by a comma
# # Order_id      Name
# # 23423         Chicken Balls, Curry Sauce, Chips
itemList <- ddply(retail, c("Order_OrderId"), function(df1)paste(df1$Name, collapse = ","))

# # drop OrderId column
itemList$Order_OrderId <- NULL

# # rename remaiing column to items
colnames(itemList) <- c("items")

# # write to csv. This will create new column after each comma e.g.
# # Items
# # Chicken Balls | Curry Sauce | Chips
# # Kids Pizza    | Meal Deal 3 | Coke
# # use store id here to cretae unique filename
write.csv(itemList, "mba.csv", quote=FALSE, row.names = TRUE)

# # convert the csv to correct basket transaction format
tr <- read.transactions("mba.csv", format = 'basket', sep = ',')

# # create rules with support and confidence values
rules <- apriori(tr, parameter = list(supp=0.001, conf=0.8))
rules <- sort(rules, by='confidence', decreasing = TRUE)

# # List summary of rules - may be good to store these in a log file so we can confirm everything is good
summary(rules)

# # the good stuff! First shows all rules, the second shows top 10
inspect(rules)
rulesTop10 <- inspect(rules[1:10])

# # return the rules somehow, try csv first but maybe JSON, also name file by store ID or store name later
write.csv(rulesTop10, 'store_rules.csv', quote=FALSE, row.names = FALSE)