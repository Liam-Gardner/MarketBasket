# MarketBasket

# Description
A node server, serving an api that takes in a physicalRestaurantId (Store) and does the following:
1. Connects to the database
2. Performs SQL joins on several tables to get all the order items from that restaurant (Store)
3. Performs SQL query to get the data into the correct format expected by the Apriori alogrithm
4. Converts to .csv*
5. Starts an instance of R Studio
6. Runs code to extract association rules 
7. Returns the rules as a response in JSON format

* or we figure out how to read SQL in R studio!
