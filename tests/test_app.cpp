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
    assert(ambulancesNeeded(2027) == 4);
    std::cout << "PASS ambulance count rule (1 -> 1, 8 -> 2, 2027 -> 4)\n";

    std::vector<int> units = unitsNeeded(1, 2027);
    int ambs = 0, trucks = 0;
    for (int u : units) {
        if (u == VK_AMBULANCE) ambs++;
        if (u == VK_FIRE_TRUCK) trucks++;
    }
    assert(ambs == 4 && trucks == 1);
    std::cout << "PASS 2027 people -> 4 ambulances + 1 fire truck\n";

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
    HospitalChoice hc = selectHospital(g, hs, 2, 1);
    assert(hc.index >= 0 && hs[hc.index].location == 4 && hc.secs == 90);
    int before = hs[hc.index].freeBeds;
    assert(admitPatient(hs, hc.index));
    assert(hs[hc.index].freeBeds == before - 1);
    dischargePatient(hs, hc.index);
    assert(hs[hc.index].freeBeds == before);
    std::cout << "PASS hospital selection, admit and discharge\n";

    std::cout << "All app tests passed.\n";
    return 0;
}