#include <iostream>
#include "CityLoader.h"

int main() {
    CityGraph city;
    if (!loadCity("data/city.txt", city)) {
        std::cout << "Could not open data/city.txt\n";
        return 1;
    }

    std::cout << "Junctions loaded: " << city.junctionCount() << "\n";

    std::cout << "Route 1 -> 4: ";
    for (NodeId n : city.shortestPath(1, 4)) std::cout << n << " ";
    std::cout << "\nTravel time 1 -> 4: " << city.travelTime(1, 4) << " s\n";

    city.closeRoad(2, 3);
    std::cout << "After closing road 2-3, route 1 -> 4: ";
    for (NodeId n : city.shortestPath(1, 4)) std::cout << n << " ";
    std::cout << "\nTravel time now: " << city.travelTime(1, 4) << " s\n";
    return 0;
}