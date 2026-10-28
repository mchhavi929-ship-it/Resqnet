#ifndef CITY_HPP
#define CITY_HPP

#include <map>
#include <string>
#include <utility>
#include <vector>

namespace resqnet {

struct Junction {
    int id;
    int x;
    int y;
    std::string type;   // base, hospital, normal
    std::string name;
};

struct Road {
    int from;
    int to;
    int distance;
    int baseTime;
    double congestion;
    bool closed;
};

class City {
public:
    City() = default;

    // Throws std::runtime_error if the file cannot be opened
    void load(const std::string& path);

    void addJunction(const Junction& j);
    void addRoad(int a, int b, int distance, int time);

    int findByName(const std::string& name) const;     // -1 if not found
    const std::string& nameOf(int id) const;
    bool hasJunction(int id) const;
    bool position(int id, int& x, int& y) const;
    int junctionCount() const;

    // Toggle a road in both directions. Returns false if the road does not exist.
    bool setRoadClosed(int a, int b, bool closed);

    // Unique roads (a < b), for display
    std::vector<Road> uniqueRoads() const;

    // Dijkstra. Returns path (empty if unreachable). Writes seconds if pointer given.
    std::vector<int> shortestPath(int start, int goal, int* seconds = nullptr) const;

private:
    std::map<int, Junction> junctions_;
    std::vector<Road> roads_;
};

} // namespace resqnet

#endif