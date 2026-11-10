#include <cassert>
#include <iostream>
#include <vector>
#include "graph.h"
#include "fleet.h"
#include "types.h"
#include "vehicle.hpp"
#include "hospital.hpp"
#include "dispatch.hpp"

using namespace resqnet;

int main() {
    assert(ambulancesNeeded(1) == 1);
    assert(ambulancesNeeded(8) == 2);
    assert(ambulancesNeeded(2027) == 60);
    std::cout << "PASS ambulances scale with people (1->1, 8->2, 2027->60)\n";

    std::vector<int> units = unitsNeeded(1, 2027);   /* Fire Emergency */
    int ambs = 0, trucks = 0;
    for (int u : units) {
        if (u == VK_AMBULANCE) ambs++;
        if (u == VK_FIRE_TRUCK) trucks++;
    }
    assert(ambs == 60 && trucks == 5);
    std::cout << "PASS 2027 people -> 60 ambulances + 5 fire trucks requested\n";

    Graph g;
    graph_init(&g);
    assert(graph_load(&g, "data/city.txt"));

    Fleet raw;
    assert(fleet_load(&raw, "data/vehicles.txt"));
    VehicleList vs;
    for (int i = 0; i < raw.count; ++i) vs.push_back(Vehicle::make(raw.v[i]));

    std::vector<int> route;
    assert(vs[0]->eta(g, 2, route) == 90);
    assert(vs[60]->eta(g, 3, route) == 119);
    std::cout << "PASS road and helicopter ETAs\n";

    auto hs = loadHospitals("data/hospitals.txt");
    auto opts = rankHospitals(g, hs, 2, 1);
    assert(!opts.empty() && hs[opts[0].index].location == 4);
    int idx = opts[0].index;
    int before = hs[idx].freeBeds;
    assert(admitPatients(hs, idx, 3) == 3);
    assert(hs[idx].freeBeds == before - 3);
    assert(admitPatients(hs, idx, 999) == before - 3);   /* capped by free beds */
    assert(hs[idx].freeBeds == 0);
    dischargePatients(hs, idx, before);
    assert(hs[idx].freeBeds == before);
    std::cout << "PASS hospital ranking, partial admit, bed cap, discharge\n";

    std::cout << "All app tests passed.\n";
    return 0;
}