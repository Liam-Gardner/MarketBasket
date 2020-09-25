# rem: with TRUE option below, #args[1] is the "--args" switch; skip it.
args <- commandArgs(TRUE)
storeId <- (args[2])

usePackage <- function(p) {
  if (!is.element(p, installed.packages()[, 1])) {
    install.packages(p, dep = TRUE, repos = "http://cran.us.r-project.org")
  }
  require(p, character.only = TRUE)
}

detach_package <- function(pkg, character.only = FALSE) {
  if (!character.only) {
    pkg <- deparse(substitute(pkg))
  }
  search_item <- paste("package", pkg, sep = ":")
  while (search_item %in% search()) {
    detach(search_item, unload = TRUE, character.only = TRUE)
  }
}

# load pacakges
usePackage('tidyverse')
usePackage('knitr')
usePackage('ggplot2')
usePackage('lubridate')
usePackage('plyr')
usePackage('plotly')

# create image save path
createPlotFileNameAndPath <- function(storeId, filename) {
  path <- capture.output(cat('plots', storeId, filename, sep = '/'))
  return(path)
}

# get file
createFileNameAndPath <- function(storeId, filename) {
  fileName <- capture.output(cat(storeId, filename, sep = "-"))
  path <- capture.output(cat(storeId, fileName, sep = '/'))
  return(path)
}
retail <- read_csv(file = createFileNameAndPath(storeId, "data.csv"))
head(retail)

# pre processing
retail$Date <- as.Date(retail$TsOrderPlaced)
retail$Time <- format(retail$TsOrderPlaced, "%H:%M:%S")

# # Popular times
retail$Time <- as.factor(retail$Time)
a <- hms(as.character(retail$Time))
retail$Time = hour(a)
popularTimesPlot <- retail %>%
  ggplot(aes(x = Time)) +
  geom_histogram(stat = "count", fill = "indianred") +
   labs(x = "Time(24hr)",
       y = "No. of Items") +
  ggtitle("Busiest Hours") +
  theme(plot.title = element_text(face = "plain", size = 12),, axis.title = element_text(face = "plain", size = 6))
ggsave(createPlotFileNameAndPath(storeId, "popularTimesPlot.png"), plot = popularTimesPlot, device = 'png', width = 10, height = 5, units = "cm")

# # Top 10 best sellers
detach_package("plyr", TRUE)
tmp <- retail %>%
  group_by(Name) %>%
  summarize(count = n()) %>%
  arrange(desc(count))
tmp <- head(tmp, n = 10)
topTenBestSellersPlot <- tmp %>%
  ggplot(aes(x = reorder(Name, count), y = count)) +
  geom_bar(stat = "identity", fill = "indian red") +
  labs(x = "",
       y = "No. of Items") +
  ggtitle("Best selling items") +
  theme(plot.title = element_text(face = "plain", size = 12), axis.title = element_text(face = "plain", size = 6), axis.text = element_text(face = "plain", size = 6)) +
  coord_flip()
ggsave(createPlotFileNameAndPath(storeId, "topTenBestSellersPlot.png"), plot = topTenBestSellersPlot, device = 'png', width = 10, height = 5, units = "cm")

# # How many items did each customer buy
detach_package("plyr", TRUE)

# itemsCustomerBoughtCountPlot <- retail %>%
itemsCustomerBoughtCountPlot <- retail %>%
  group_by(OrderId) %>%
  summarize(n_items = round(mean(Quantity), digits = 0)) %>%
  ggplot(aes(x = n_items)) +
  geom_histogram(fill = "indianred", binwidth = 0.5) +
  labs(x = "No. of Items",
       y = "Count") +
  ggtitle("How many items does each customer buy?") +
  theme(plot.title = element_text(face = "plain", size = 12), axis.title = element_text(face = "plain", size = 6)) +
scale_x_continuous(breaks = seq(1, 10, by = 1)) +
coord_cartesian(xlim = c(1, 10))

ggsave(createPlotFileNameAndPath(storeId, "itemsBoughtPlot.png"), plot = itemsCustomerBoughtCountPlot, device = 'png', width = 10, height = 5, units = "cm")
