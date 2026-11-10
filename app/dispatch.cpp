#include "dispatch.hpp"
#include <iomanip>
#include <iostream>
#include <memory>
#include <sstream>

namespace resqnet {

namespace {
const int AMB_PER_UNIT   = 4;
const int AMB_CAP        = 60;
const int OTHER_PER_UNIT = 500;
const int OTHER_CAP      = 10;

std::vector<bool> busyVehicles(const VehicleList& fleet, const IncidentStore& store) {
    std::vector<bool> busy(fleet.size(), false);
    for (int i = 0; i < store.count; ++i) {
        const Incident& o = store.items[i];
        if (!isBusy(o.status)) continue;
        for (int k = 0; k < o.vcount; ++k) {
            if (o.vehicles[k] >= 0 && o.vehicles[k] < static_cast<int>(fleet.size()))
                busy[o.vehicles[k]] = true;
        }
    }
    return busy;
}

int fillUnits(const Graph& g, const VehicleList& fleet, IncidentStore& store,
              int idx, int& shortage) {
    Incident& inc = store.items[idx];
    std::vector<bool> busy = busyVehicles(fleet, store);
    std::vector<int> want = unitsStillNeeded(inc, fleet);

    int added = 0;
    shortage = 0;

    for (int kind = 0; kind < VK_KIND_COUNT; ++kind) {
        int need = 0;
        for (int w : want) if (w == kind) need++;
        if (need == 0) continue;

        int got = 0;
        while (got < need && inc.vcount < INC_MAX_UNITS) {
            int vi = bestIndex(fleet, [&](const std::unique_ptr<Vehicle>& v, std::size_t i) -> int {
                if (busy[i] || v->kind() != kind) return -1;
                std::vector<int> r;
                return v->eta(g, inc.location, r);
            });
            if (vi < 0) break;

            busy[vi] = true;
            inc.vehicles[inc.vcount++] = vi;
            printVehicleLine(g, *fleet[vi], inc.location);
            got++;
        }

        int miss = need - got;
        shortage += miss;
        added += got;
        if (miss > 0) {
            std::cout << "  [--] " << miss << " more " << vehicle_kind_name(kind)
                      << "(s) needed, none free right now\n";
            int wait = secondsUntilFree(g, fleet, store, kind);
            if (wait >= 0)
                std::cout << "       Next " << vehicle_kind_name(kind)
                          << " likely free in about " << wait << " s. Top up again then.\n";
            else
                std::cout << "       No " << vehicle_kind_name(kind)
                          << " is assigned right now, so there is no release time.\n";
        }
    }
    return added;
}
} // namespace

int ambulancesNeeded(int people) {
    int n = (people + AMB_PER_UNIT - 1) / AMB_PER_UNIT;
    if (n < 1) n = 1;
    if (n > AMB_CAP) n = AMB_CAP;
    return n;
}

int othersNeeded(int people) {
    int n = 1 + people / OTHER_PER_UNIT;
    if (n > OTHER_CAP) n = OTHER_CAP;
    return n;
}

std::vector<int> unitsNeeded(int type, int people) {
    std::vector<int> out;
    const int* need = type_needs(type);
    for (int k = 0; k < 4 && need[k] != -1; ++k) {
        int reps = (need[k] == VK_AMBULANCE) ? ambulancesNeeded(people) : othersNeeded(people);
        for (int r = 0; r < reps && static_cast<int>(out.size()) < INC_MAX_UNITS; ++r) {
            out.push_back(need[k]);
        }
    }
    return out;
}

std::vector<int> unitsStillNeeded(const Incident& inc, const VehicleList& fleet) {
    int have[VK_KIND_COUNT] = {0};
    for (int k = 0; k < inc.vcount; ++k) {
        int vi = inc.vehicles[k];
        if (vi >= 0 && vi < static_cast<int>(fleet.size())) have[fleet[vi]->kind()]++;
    }
    std::vector<int> out;
    for (int kind : unitsNeeded(inc.type, inc.people)) {
        if (have[kind] > 0) have[kind]--;
        else out.push_back(kind);
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

int secondsUntilFree(const Graph& g, const VehicleList& fleet,
                     const IncidentStore& store, int kind) {
    int best = -1;
    for (int i = 0; i < store.count; ++i) {
        const Incident& o = store.items[i];
        if (!isBusy(o.status)) continue;

        for (int k = 0; k < o.vcount; ++k) {
            int vi = o.vehicles[k];
            if (vi < 0 || vi >= static_cast<int>(fleet.size())) continue;
            if (fleet[vi]->kind() != kind) continue;

            std::vector<int> r1;
            int toScene = fleet[vi]->eta(g, o.location, r1);
            if (toScene < 0) continue;

            int bestHosp = -1;
            for (int j = 1; j <= GRAPH_MAX_NODES; ++j) {
                if (!graph_has_node(&g, j)) continue;
                const char* t = g.nodes[j].type;
                if (t[0] != 'h' && t[0] != 'H') continue;
                int path[GRAPH_MAX_NODES];
                int secs = 0;
                if (graph_shortest_path(&g, o.location, j, path, GRAPH_MAX_NODES, &secs) == 0) continue;
                if (bestHosp < 0 || secs < bestHosp) bestHosp = secs;
            }
            int toHosp = (bestHosp < 0) ? 0 : bestHosp;

            int total = toScene + toHosp;
            if (best < 0 || total < best) best = total;
        }
    }
    return best;
}

bool dispatchIncident(const Graph& g, const VehicleList& fleet,
                      IncidentStore& store, int idx) {
    Incident& inc = store.items[idx];

    std::cout << "\nDispatching #" << inc.id << ": " << type_name(inc.type)
              << " at " << graph_name(&g, inc.location)
              << " (" << inc.people << " people)\n";

    int shortage = 0;
    int added = fillUnits(g, fleet, store, idx, shortage);

    if (inc.vcount > 0 && inc.status == INC_REPORTED) inc.status = INC_DISPATCHED;

    if (inc.vcount > 0) std::cout << "  Status: DISPATCHED with " << inc.vcount << " unit(s)\n";
    else                std::cout << "  Status: still REPORTED (no free units right now)\n";

    if (shortage > 0) {
        std::cout << "  Shortfall: " << shortage << " unit(s) still needed. "
                  << "Use 'Top up units' when vehicles are free.\n";
    }
    return added > 0;
}

void topUpIncident(const Graph& g, const VehicleList& fleet,
                   IncidentStore& store, int idx) {
    Incident& inc = store.items[idx];
    if (inc.status != INC_DISPATCHED && inc.status != INC_ARRIVED) {
        std::cout << "Only dispatched or arrived incidents can be topped up.\n";
        return;
    }

    std::cout << "\nTop-up #" << inc.id << ": " << type_name(inc.type) << "\n";
    int shortage = 0;
    int added = fillUnits(g, fleet, store, idx, shortage);

    if (added == 0 && shortage == 0) std::cout << "  Already has all the units it needs.\n";
    else if (added == 0)             std::cout << "  No free units right now. Still short: " << shortage << "\n";
    else                             std::cout << "  Added " << added << " unit(s). Still short: " << shortage << "\n";
}

void releaseUnits(IncidentStore& store, int idx) {
    Incident& inc = store.items[idx];
    if (inc.status != INC_ARRIVED) {
        std::cout << "Only an arrived incident can release its units.\n";
        return;
    }
    int freed = inc.vcount;
    for (int k = 0; k < INC_MAX_UNITS; ++k) inc.vehicles[k] = -1;
    inc.vcount = 0;
    inc.status = INC_RELEASED;
    std::cout << "Released " << freed << " unit(s) from #" << inc.id
              << ". They are free for other incidents now.\n"
              << "Patients still in hospital are kept until you mark it resolved.\n";
}

} // namespace resqnet