#include "vehicle.hpp"
#include <cmath>
#include <utility>
#include "types.h"

namespace resqnet {

namespace {
const double HELI_SPEED_MPS = 16.7;
const double METRES_PER_UNIT = 10.0;
}

Vehicle::Vehicle(int id, int kind, int base, std::string name)
    : id_(id), kind_(kind), location_(base), name_(std::move(name)) {}

std::unique_ptr<Vehicle> Vehicle::make(const FleetVehicle& fv) {
    if (fv.kind == VK_HELICOPTER)
        return std::make_unique<Helicopter>(fv.id, fv.kind, fv.base, fv.name);
    return std::make_unique<RoadVehicle>(fv.id, fv.kind, fv.base, fv.name);
}

std::ostream& operator<<(std::ostream& out, const Vehicle& v) {
    return out << v.name_ << " (" << v.mode() << ") from junction " << v.location_;
}

int RoadVehicle::eta(const Graph& g, int target, std::vector<int>& route) const {
    int path[GRAPH_MAX_NODES];
    int secs = 0;
    int n = graph_shortest_path(&g, location_, target, path, GRAPH_MAX_NODES, &secs);
    route.assign(path, path + n);
    return n == 0 ? -1 : secs;
}

int Helicopter::eta(const Graph& g, int target, std::vector<int>& route) const {
    if (!graph_has_node(&g, location_) || !graph_has_node(&g, target)) return -1;
    const GraphNode& a = g.nodes[location_];
    const GraphNode& b = g.nodes[target];
    double dx = a.x - b.x, dy = a.y - b.y;
    route = {location_, target};
    double metres = std::sqrt(dx * dx + dy * dy) * METRES_PER_UNIT;
    return static_cast<int>(metres / HELI_SPEED_MPS);
}

} // namespace resqnet