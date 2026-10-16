#include <iostream>
#include <vector>
#include "CityLoader.h"
#include "InputHandler.h"
#include "DisasterQueue.h"
#include "ResourcePool.h"

// Which vehicle types respond to each disaster type
static std::vector<VehicleType> requiredFor(DisasterType t) {
    switch (t) {
        case DisasterType::Fire:              return {VehicleType::FireTruck, VehicleType::Ambulance};
        case DisasterType::Flood:             return {VehicleType::RescueBoat, VehicleType::Ambulance};
        case DisasterType::RoadAccident:      return {VehicleType::Ambulance, VehicleType::Police};
        case DisasterType::Storm:             return {VehicleType::Ambulance, VehicleType::HeavyRescue};
        case DisasterType::Earthquake:        return {VehicleType::Ambulance, VehicleType::HeavyRescue};
        case DisasterType::BuildingCollapse:  return {VehicleType::Ambulance, VehicleType::HeavyRescue};
        case DisasterType::HazardousIncident: return {VehicleType::FireTruck, VehicleType::Police};
    }
    return {VehicleType::Ambulance};
}

int main() {
    CityGraph city;
    if (!loadCity("data/city.txt", city)) {
        std::cout << "Could not open data/city.txt\n";
        return 1;
    }

    ResourcePool pool;
    if (!loadVehicles("data/vehicles.txt", pool)) {
        std::cout << "Could not open data/vehicles.txt\n";
        return 1;
    }

    std::cout << "=== RESQNET Phase 1 ===\n\n";

    // Collect as many emergencies as the user wants
    DisasterQueue queue;
    int nextId = 1;

    while (true) {
        std::cout << "Add an emergency? (y/n): ";
        std::string answer;
        std::getline(std::cin, answer);
        if (answer.empty() || (answer[0] != 'y' && answer[0] != 'Y')) break;

        queue.push(askDisasterFromUser(nextId++, city));
        std::cout << "\n";
    }

    if (queue.empty()) {
        std::cout << "No emergencies entered. Exiting.\n";
        return 0;
    }

    // Dispatch by priority
    std::cout << "\n=== Dispatching by priority ===\n";
    int order = 1;
    while (!queue.empty()) {
        Disaster d = queue.pop();
        std::cout << "\n[Handled " << order++ << "] " << describe(d) << "\n";

        std::vector<VehicleType> needed = requiredFor(d.type);
        for (VehicleType t : needed) {
            int idx = pool.findBestVehicle({t}, d.location, city);
            if (idx < 0) {
                std::cout << "  No free vehicle of that type\n";
                continue;
            }

            Vehicle& v = pool.at(idx);
            std::vector<NodeId> path = city.shortestPath(v.location, d.location);
            Seconds total = city.travelTime(v.location, d.location);

            std::cout << "  " << v.name << " dispatched from " << city.nameOf(v.location) << "\n";
            std::cout << "  Route: ";
            for (size_t i = 0; i < path.size(); ++i) {
                std::cout << city.nameOf(path[i]);
                if (i + 1 < path.size()) std::cout << " -> ";
            }
            std::cout << "\n";

            Seconds clock = 0;
            for (size_t i = 0; i + 1 < path.size(); ++i) {
                for (const Road& r : city.getRoadsFrom(path[i])) {
                    if (r.to == path[i + 1]) {
                        clock += static_cast<Seconds>(r.baseTime * r.congestion);
                        break;
                    }
                }
                std::cout << "  t=" << clock << "s  " << v.name
                          << " reached " << city.nameOf(path[i + 1]) << "\n";
            }
            std::cout << "  " << v.name << " is now ON SCENE (total " << total << " s)\n";

            v.state = VehicleState::OnScene;
            v.location = d.location;
        }
    }
    return 0;
}