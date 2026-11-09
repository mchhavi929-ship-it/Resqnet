#include "simulation.hpp"
#include <algorithm>
#include <iomanip>

namespace resqnet {

void Simulation::schedule(int time, EventKind kind, int incidentId, std::string text) {
    queue_.push(Event{time, kind, incidentId, std::move(text)});
}

void Simulation::run(std::ostream& out) {
    while (!queue_.empty()) {
        Event e = queue_.top();
        queue_.pop();
        out << "  [t=" << std::setw(5) << e.time << " s] #" << e.incidentId << "  "
            << (e.kind == EventKind::VehicleArrives ? "ARRIVE  " : "HOSPITAL") << "  "
            << e.text << "\n";
    }
}

void planVehicles(Simulation& sim, const Graph& g, const VehicleList& vehicles, const Incident& inc) {
    for (int k = 0; k < inc.vcount; ++k) {
        const Vehicle& v = *vehicles[inc.vehicles[k]];
        std::vector<int> route;
        int t = v.eta(g, inc.location, route);
        if (t < 0) continue;
        sim.schedule(t, EventKind::VehicleArrives, inc.id,
                     v.name() + " reached " + graph_name(&g, inc.location));
    }
}

int lastArrival(const Graph& g, const VehicleList& vehicles, const Incident& inc) {
    int last = 0;
    for (int k = 0; k < inc.vcount; ++k) {
        const Vehicle& v = *vehicles[inc.vehicles[k]];
        std::vector<int> route;
        int t = v.eta(g, inc.location, route);
        if (t >= 0) last = std::max(last, t);
    }
    return last;
}

} // namespace resqnet