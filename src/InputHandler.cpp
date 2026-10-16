#include "InputHandler.h"
#include <iostream>
#include <limits>

static void printPlaces(const CityGraph& city) {
    std::cout << "Places on the map:\n";
    for (int id = 1; id <= 100; ++id) {
        if (city.hasJunction(id)) {
            std::cout << "  - " << city.nameOf(id) << "\n";
        }
    }
}

static int readInt(const std::string& prompt, int lo, int hi) {
    while (true) {
        std::cout << prompt;
        int v;
        if (std::cin >> v && v >= lo && v <= hi) {
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
            return v;
        }
        std::cin.clear();
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
        std::cout << "Please enter a number from " << lo << " to " << hi << ".\n";
    }
}

Disaster askDisasterFromUser(DisasterId id, const CityGraph& city) {
    Disaster d;
    d.id = id;
    d.reportedAt = 0;

    printPlaces(city);
    while (true) {
        std::cout << "Where is the emergency? (type the exact place name): ";
        std::string name;
        std::getline(std::cin, name);
        NodeId loc = city.findJunctionByName(name);
        if (loc != INVALID_NODE) {
            d.location = loc;
            break;
        }
        std::cout << "Place not found. Pick one from the list above.\n";
    }

    std::cout << "\nWhat happened?\n"
              << "  1. Fire\n  2. Flood\n  3. Earthquake\n  4. Road accident\n"
              << "  5. Building collapse\n  6. Storm\n  7. Hazardous incident\n";
    int typeChoice = readInt("Enter number (1-7): ", 1, 7);
    d.type = static_cast<DisasterType>(typeChoice - 1);

    d.severity = readInt("Severity (1 = minor, 10 = critical): ", 1, 10);
    d.peopleAffected = readInt("How many people are affected? ", 0, 100000);

    return d;
}