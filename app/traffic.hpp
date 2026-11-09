#ifndef TRAFFIC_HPP
#define TRAFFIC_HPP

#include <string>
#include "graph.h"

namespace resqnet {

int loadTraffic(Graph& g, const std::string& path);

} // namespace resqnet

#endif