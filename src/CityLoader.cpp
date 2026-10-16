#include "CityLoader.h"
#include <fstream>
#include <sstream>

static std::string trim(const std::string& s) {
    const char* ws = " \t\r\n";
    size_t start = s.find_first_not_of(ws);
    if (start == std::string::npos) return "";
    size_t end = s.find_last_not_of(ws);
    return s.substr(start, end - start + 1);
}

bool loadCity(const std::string& path, CityGraph& city) {
    std::ifstream in(path);
    if (!in) return false;

    std::string line;
    while (std::getline(in, line)) {
        line = trim(line);
        if (line.empty() || line[0] == '#') continue;

        std::istringstream ss(line);
        std::string tag;
        ss >> tag;

        if (tag == "J") {
            NodeId id;
            int x, y;
            std::string type, name;
            ss >> id >> x >> y >> type;
            std::getline(ss, name);

            Junction j;
            j.id = id;
            j.position = {x, y};
            j.isBlocked = false;
            j.name = trim(name);
            j.type = type;
            city.addJunction(j);
        }
        else if (tag == "R") {
            NodeId from, to;
            int distance;
            Seconds time;
            ss >> from >> to >> distance >> time;
            city.addRoad({from, to, distance, time, 1.0, false});
        }
    }
    return true;
}