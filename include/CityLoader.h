#ifndef CITYLOADER_H
#define CITYLOADER_H

#include <string>
#include "CityGraph.h"

// Reads data/city.txt and fills the graph.
// Returns true on success, false if the file cannot be opened.
bool loadCity(const std::string& path, CityGraph& city);

#endif // CITYLOADER_H