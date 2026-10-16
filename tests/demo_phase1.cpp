#include <iostream>
#include <iomanip>
#include <vector>
#include "CityLoader.h"
#include "InputHandler.h"
#include "DisasterQueue.h"
#include "ResourcePool.h"

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

static std::string typeName(DisasterType t) {
    static const char* names[] = {
        "Fire", "Flood", "Earthquake", "Road accident",
        "Building collapse", "Storm", "Hazardous incident"
    };
    return names[static_cast<int>(t)];
}

static void printLine(char c = '=') {
    std::cout << std::string(60, c) << "\n";
}

static void printHeader(const std::string& title) {
    printLine();
    std::cout << " " << title << "\n";
    printLine();
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

    printHeader("RESQNET Phase 1 - Emergency Input");

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

    int total = queue.size();
    printHeader("DISPATCH REPORT  (" + std::to_string(total) + " incident(s), by priority)");

    int order = 1;
    while (!queue.empty()) {
        Disaster d = queue.pop();

        std::cout << "\n INCIDENT " << order << " of " << total
                  << "  |  " << typeName(d.type) << "\n";
        std::cout << " Location : " << city.nameOf(d.location)
                  << " (junction " << d.location << ")\n";
        std::cout << " Severity : " << d.severity << "/10"
                  << "  |  People affected: " << d.peopleAffected << "\n";
        std::cout << " Priority : " << (order == 1 ? "Handled first" : "Queued") << "\n";
        printLine('-');

        std::vector<VehicleType> needed = requiredFor(d.type);
        for (VehicleType t : needed) {
            int idx = pool.findBestVehicle({t}, d.location, city);
            if (idx < 0) {
                std::cout << "  [--] No free vehicle of the required type\n";
                continue;
            }

            Vehicle& v = pool.at(idx);
            std::vector<NodeId> path = city.shortestPath(v.location, d.location);
            Seconds arrival = city.travelTime(v.location, d.location);

            std::cout << "  [GO] " << v.name << "  (from " << city.nameOf(v.location) << ")\n";
            std::cout << "       Route   : ";
            for (size_t i = 0; i < path.size(); ++i) {
                std::cout << city.nameOf(path[i]);
                if (i + 1 < path.size()) std::cout << " -> ";
            }
            std::cout << "\n";
            std::cout << "       Arrives : " << arrival << " s  -  ON SCENE\n";

            v.state = VehicleState::OnScene;
            v.location = d.location;
        }
        printLine();
        order++;
    }
    return 0;
}