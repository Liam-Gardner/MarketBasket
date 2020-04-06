# helpers

# list of loaded packages
loadedPackages <- (.packages())

# check if pkg is loaded
"dplyr" %in% tolower(loadedPackages)

# And load it if it's not loaded yet
if(! "dplyr" %in% tolower((.packages()))){
  library("dplyr")
  (.packages())
}

# remove package
detach("package:dplyr", unload=FALSE)

# store list of installed libraries
my_packages <- library()$results[,1]