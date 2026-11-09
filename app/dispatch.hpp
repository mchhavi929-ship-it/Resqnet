#ifndef DISPATCH_HPP
#define DISPATCH_HPP

#include <cstddef>
#include <string>
#include <vector>
#include "graph.h"
#include "incident.h"
#include "types.h"
#include "vehicle.hpp"

namespace resqnet {

template <typename Container, typename Cost>
int bestIndex(const Container& items, Cost cost) {
    int best = -1;
    int bestCost = INF_SECONDS;
    for (std::size_t i = 0; i < items.size(); ++i) {
        int c = cost(items[i], i);
        if (c >= 0 && c < bestCost) {
            bestCost = c;
            best = static_cast<int>(i);
        }
    }
    return best;
}

int ambulancesNeeded(int people);
std::vector<int> unitsNeeded(int type, int people);
bool isBusy(int status);
std::string formatRoute(const Graph& g, const std::vector<int>& route);
void printVehicleLine(const Graph& g, const Vehicle& v, int target);
bool dispatchIncident(const Graph& g, const VehicleList& fleet,
                      IncidentStore& store, int idx);

} // namespace resqnet

#endif