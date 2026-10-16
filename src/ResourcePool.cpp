#include "ResourcePool.h"
#include <fstream>
#include <sstream>
#include <cmath>

static std::string trim(const std::string& s) {
    const char* ws = " \t\r\n";
    size_t start = s.find_first_not_of(ws);
    if (start == std::string::npos) return "";
    size_t end = s.find_last_not_of(ws);
    return s.substr(start, end - start + 1);
}

static bool parseVehicleType(const std::string& t, VehicleType& out) {
    if (t == "Ambulance")       { out = VehicleType::Ambulance; return true; }
    if (t == "FireTruck")       { out = VehicleType::FireTruck; return true; }
    if (t == "Police")          { out = VehicleType::Police; return true; }
    if (t == "RecoveryVehicle") { out = VehicleType::RecoveryVehicle; return true; }
    if (t == "HeavyRescue")     { out = VehicleType::HeavyRescue; return true; }
    if (t == "Helicopter")      { out = VehicleType::Helicopter; return true; }
    if (t == "RescueBoat")      { out = VehicleType::RescueBoat; return true; }
    if (t == "ReliefSupply")    { out = VehicleType::ReliefSupply; return true; }
    return false;
}

// Helicopter speed in metres per second (about 60 km/h, for the demo)
static const double HELICOPTER_SPEED_MPS = 16.7;

// Straight-line distance between two junctions, in metres
static double straightDistance(const CityGraph& city, NodeId a, NodeId b) {
    const Junction& ja = city.getJunction(a);
    const Junction& jb = city.getJunction(b);
    double dx = ja.position.x - jb.position.x;
    double dy = ja.position.y - jb.position.y;
    return std::sqrt(dx * dx + dy * dy) * 10.0;   // 1 grid unit = 10 m for the demo
}

void ResourcePool::addVehicle(const Vehicle& v) {
    vehicles_.push_back(v);
}

int ResourcePool::vehicleCount() const {
    return static_cast<int>(vehicles_.size());
}

Vehicle& ResourcePool::at(int index) {
    return vehicles_.at(index);
}

const Vehicle& ResourcePool::at(int index) const {
    return vehicles_.at(index);
}

Seconds ResourcePool::travelSeconds(const Vehicle& v, NodeId target, const CityGraph& city) const {
    if (v.type == VehicleType::Helicopter) {
        double metres = straightDistance(city, v.location, target);
        return static_cast<Seconds>(metres / HELICOPTER_SPEED_MPS);
    }
    return city.travelTime(v.location, target);
}

int ResourcePool::findBestVehicle(const std::vector<VehicleType>& required,
                                  NodeId incidentLocation,
                                  const CityGraph& city) const {
    int best = -1;
    Seconds bestTime = INFINITE_TIME;

    for (int i = 0; i < static_cast<int>(vehicles_.size()); ++i) {
        const Vehicle& v = vehicles_[i];
        if (v.state != VehicleState::Available) continue;

        bool wanted = false;
        for (VehicleType t : required) if (t == v.type) { wanted = true; break; }
        if (!wanted) continue;

        Seconds t = travelSeconds(v, incidentLocation, city);
        if (t < bestTime) {
            bestTime = t;
            best = i;
        }
    }
    return best;
}

bool loadVehicles(const std::string& path, ResourcePool& pool) {
    std::ifstream in(path);
    if (!in) return false;

    std::string line;
    while (std::getline(in, line)) {
        line = trim(line);
        if (line.empty() || line[0] == '#') continue;

        std::istringstream ss(line);
        std::string tag, typeStr;
        VehicleId id;
        NodeId base;
        ss >> tag;
        if (tag != "V") continue;

        ss >> id >> typeStr >> base;
        std::string name;
        std::getline(ss, name);

        VehicleType type;
        if (!parseVehicleType(typeStr, type)) continue;

        Vehicle v;
        v.id = id;
        v.type = type;
        v.state = VehicleState::Available;
        v.location = base;
        v.name = trim(name);
        pool.addVehicle(v);
    }
    return true;
}