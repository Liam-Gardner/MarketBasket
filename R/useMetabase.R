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
usePackage('tidyverse') 
usePackage('readxl')
usePackage('knitr')
# usePackage('ggplot2')
usePackage('lubridate')
usePackage('arules')
usePackage('arulesViz')
usePackage('rjson')

# create filename/dir
fn_data_csv <- capture.output(cat(storeId, "data.csv", sep="-"))
path_data_csv <- capture.output(cat(storeId, fn_data_csv, sep='/'))
retail <- read.csv(file = path_data_csv)
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
path_mba <- capture.output(cat(storeId, fn_mba, sep='/'))


write.csv(itemList, path_mba, quote=FALSE, row.names = TRUE)

# convert the csv to correct basket transaction format
# rm.duplicates=TRUE added beacuse it does it anyway, it cant handle quantities witin a transaction so wants to remove duplicates.
# e.g If the item list is Stuffed Auberginea, Stuffed Auberginea, Stuffed Auberginea, Stuffed Auberginea it would be a waste if time returning a rule saying
#{Stuffed Auberginea} => {Stuffed Auberginea}
# imagine suggesting more of the same!
# file name should be storeId
tr <- read.transactions(path_mba, format = 'basket', sep = ',', rm.duplicates=TRUE, quote="") 
# quote = "" means quote off
# quote="\"" means quote on
# type = S4

# create rules with support and confidence values #type = s4
rules <- apriori(tr, parameter = list(supp=0.001, conf=confidence))
sortBy <- c('confidence', 'lift')
rules <- sort(rules, by=sortBy, decreasing = TRUE) 

# Statistial summary of the rules - store these
fn_summary <- capture.output(cat(storeId, "summary.txt", sep="-"))
path_summary <- capture.output(cat(storeId, fn_summary, sep='/'))

summary_rules <- summary(rules)
capture.output(summary_rules, file=path_summary)

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
    print(typeof(r))
    print(rulesAmount)
    print(typeof(rulesAmount))
    r <- inspect(rules[1:rulesAmount,])
    return(r)
  }
}

# check this 
# https://stackoverflow.com/questions/25730000/converting-object-of-class-rules-to-data-frame-in-r

if(byItemName) {
  rulesAsDataFrame = data.frame(lhs = labels(lhs(rules)), rhs = labels(rhs(rules)),rules@quality)
  topRules <- rulesAsDataFrame[1:rulesAmount,]
} else {topRules <- getRules(rules, rulesAmount)}


# list[1:10] the 1 to 10 represents columns not the rows!

# write json to file, use storeId as name
rules_json <- toJSON(topRules, indent=1, method="C")
fn_rulesJson <- capture.output(cat(storeId, "rules.json", sep="-"))
path_rulesJson <- capture.output(cat(storeId, fn_rulesJson, sep='/'))
write(rules_json, file=path_rulesJson)

# delete mba file
# unlink(fn_mba)
