#include "dispatch.hpp"
#include <iomanip>
#include <iostream>
#include <sstream>
#include <memory>

namespace resqnet {

int ambulancesNeeded(int people) {
    int n = (people + 3) / 4;
    if (n < 1) n = 1;
    if (n > 4) n = 4;
    return n;
}

std::vector<int> unitsNeeded(int type, int people) {
    std::vector<int> out;
    const int* need = type_needs(type);
    for (int k = 0; k < 4 && need[k] != -1; ++k) {
        int reps = (need[k] == VK_AMBULANCE) ? ambulancesNeeded(people) : 1;
        for (int r = 0; r < reps && static_cast<int>(out.size()) < INC_MAX_UNITS; ++r) {
            out.push_back(need[k]);
        }
    }
    return out;
}

bool isBusy(int status) {
    return status == INC_DISPATCHED || status == INC_ARRIVED;
}

std::string formatRoute(const Graph& g, const std::vector<int>& route) {
    std::ostringstream out;
    for (std::size_t i = 0; i < route.size(); ++i) {
        out << graph_name(&g, route[i]);
        if (i + 1 < route.size()) out << " -> ";
    }
    return out.str();
}

void printVehicleLine(const Graph& g, const Vehicle& v, int target) {
    std::vector<int> route;
    int secs = v.eta(g, target, route);

    std::cout << "  [GO] " << v.name() << " (" << vehicle_kind_name(v.kind())
              << ") from " << graph_name(&g, v.location()) << "\n";

    if (secs < 0) {
        std::cout << "       Route   : no route available\n";
        return;
    }
    if (v.kind() == VK_HELICOPTER) {
        std::cout << "       Route   : direct flight (ignores roads)\n";
    } else {
        std::cout << "       Route   : " << formatRoute(g, route) << "\n";
    }
    std::cout << "       ETA     : " << std::setw(4) << secs << " s (about "
              << (secs + 59) / 60 << " min)\n";
}

bool dispatchIncident(const Graph& g, const VehicleList& fleet,
                      IncidentStore& store, int idx) {
    Incident& inc = store.items[idx];

    std::vector<bool> busy(fleet.size(), false);
    for (int i = 0; i < store.count; ++i) {
        const Incident& o = store.items[i];
        if (!isBusy(o.status)) continue;
        for (int k = 0; k < o.vcount; ++k) {
            if (o.vehicles[k] >= 0 && o.vehicles[k] < static_cast<int>(fleet.size()))
                busy[o.vehicles[k]] = true;
        }
    }

    std::cout << "\nDispatching #" << inc.id << ": " << type_name(inc.type)
              << " at " << graph_name(&g, inc.location)
              << " (" << inc.people << " people)\n";

    inc.vcount = 0;
    for (int wanted : unitsNeeded(inc.type, inc.people)) {
        int vi = bestIndex(fleet, [&](const std::unique_ptr<Vehicle>& v, std::size_t i) -> int {
            if (busy[i] || v->kind() != wanted) return -1;
            std::vector<int> r;
            return v->eta(g, inc.location, r);
        });

        if (vi < 0) {
            std::cout << "  [--] No free " << vehicle_kind_name(wanted) << " right now\n";
            continue;
        }
        busy[vi] = true;
        inc.vehicles[inc.vcount++] = vi;
        printVehicleLine(g, *fleet[vi], inc.location);
    }

    if (inc.vcount > 0) {
        inc.status = INC_DISPATCHED;
        std::cout << "  Status: DISPATCHED with " << inc.vcount << " unit(s)\n";
        return true;
    }
    std::cout << "  Status: still REPORTED (will retry when a unit is free)\n";
    return false;
}

} // namespace resqnet