# rem: with TRUE option below, #args[1] is the "--args" switch; skip it.
args <- commandArgs(TRUE)
storeId <- (args[2])
confidence <- as.numeric((args[3]))
rulesAmount <- as.numeric((args[4]))
# if we get the rules by Item name we need to worry about the strings that contain commas or qoutes
# eg an item could be 15" pizza
# or Chips, Medium
# we are splitting based on delimters such as commas when we read in transactions
# we should strip out commas and maybe the quotes too
# With quotes we could set quote delimeter = "\"", which means any string in column that has quotes around it is still one string, do not seperate
# eg this string -> "Coke, chips, burger" is not seperated at the commas
# we will use quote="" to ignore all qoutes, actually this screws up the json
byItemName <- (args[5])

print(args)

# checks if package is installed and then installs
usePackage <- function(p) {
  if (!is.element(p, installed.packages()[,1])) {
    install.packages(p, dep = TRUE, repos = "http://cran.us.r-project.org")
  }
  require(p, character.only = TRUE)
}


# load libraries
# load first so dplyr in tidyverse does not complain
usePackage('plyr') 
# # remove.packages('dplyr')
usePackage('tidyverse') 
usePackage('readxl')
usePackage('knitr')
usePackage('ggplot2')
usePackage('lubridate')
usePackage('arules')
usePackage('arulesViz')
usePackage('rjson')




# create filename
data_csv <- capture.output(cat(storeId, "data.csv", sep="-"))
retail <- read.csv(file = data_csv)
print(head(retail)) # type = list

# This groups order items under one order_id and into one column seperated by a comma
# Order_id      Name
# 23423         Chicken Balls, Curry Sauce, Chips
itemList <- ddply(retail, c("OrderId"), function(df1)paste(if(byItemName == 'True') {df1$Name} else{df1$MenuItemId}, collapse = ",")) # type = list

# drop OrderId column
itemList$OrderId <- NULL

# rename remaining column to items
colnames(itemList) <- c("items") # c combine

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
tr <- read.transactions(fn_mba, format = 'basket', sep = ',', rm.duplicates=TRUE, quote="\"'") 
# type = S4
# quote="\""

# create rules with support and confidence values #type = s4
rules <- apriori(tr, parameter = list(supp=0.001, conf=confidence))
rules <- sort(rules, by='confidence', decreasing = TRUE) 

# Statistial summary of the rules - store these
fn_summary <- capture.output(cat(storeId, "summary.txt", sep="-"))
summary_rules <- summary(rules)
capture.output(summary_rules, file=fn_summary)

# dplyr now
# usePackage('dplyr')

# the good stuff! Capture the rules
# type must be set to list before storing the rules in it using inspect
getRules <- function(rules, rulesAmount) { 
  r = list()
  rulesAsList <- list(rules)
  numOfRows <- length(rulesAsList[[1]])
  print(typeof(r))
    print(rulesAmount)
    print(typeof(rulesAmount))
  if(rulesAmount > numOfRows) {
    r <- inspect(rules)
    return(r)
  } else {
    ## not getting here or at least not printing
    print(typeof(r))
    print(rulesAmount)
    print(typeof(rulesAmount))
    r <- inspect(rules[1:rulesAmount,])
    return(r)
  }
}

# check this 
# https://stackoverflow.com/questions/25730000/converting-object-of-class-rules-to-data-frame-in-r

topRules <- getRules(rules, rulesAmount)
print(typeof(topRules))
print(topRules)

# list[1:10] the 1 to 10 represents columns not the rows!

# This step is unnecessary, in the next step we convert to JSON and that's all we need.
# write.csv(rulesTop10, 'store_rules.csv', quote=FALSE, row.names = FALSE)
# print("topRules")
# print(topRules)

# write json to file, use storeId as name
rules_json <- toJSON(topRules, indent=1, method="C")
fn_rulesJson <- capture.output(cat(storeId, "rules.json", sep="-"))
print("rules_json")
print(rules_json)

write(rules_json, file=fn_rulesJson)

# delete mba file
# unlink(fn_mba)

# rulesAsList <- inspect(rules) # does this always convert to list
# is.list(rulesAsAList) # returns boolean
# length(rulesAsList) will always return the num of obj in the list
# so use length(rulesAsList[[1]])