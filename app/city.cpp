#include "city.hpp"
#include <algorithm>
#include <cctype>
#include <functional>
#include <fstream>
#include <queue>
#include <sstream>
#include <stdexcept>

namespace resqnet {

namespace {

std::string trim(const std::string& s) {
    const char* ws = " \t\r\n";
    auto b = s.find_first_not_of(ws);
    if (b == std::string::npos) return "";
    auto e = s.find_last_not_of(ws);
    return s.substr(b, e - b + 1);
}

std::string toLower(std::string s) {
    std::transform(s.begin(), s.end(), s.begin(),
                   [](unsigned char ch) { return static_cast<char>(std::tolower(ch)); });
    return s;
}

} // namespace

void City::load(const std::string& path) {
    std::ifstream in(path);
    if (!in) throw std::runtime_error("Cannot open map file: " + path);

    std::string line;
    while (std::getline(in, line)) {
        line = trim(line);
        if (line.empty() || line[0] == '#') continue;

        std::istringstream ss(line);
        char tag;
        ss >> tag;

        if (tag == 'J') {
            Junction j;
            ss >> j.id >> j.x >> j.y >> j.type;
            std::getline(ss, j.name);
            j.name = trim(j.name);
            if (ss.fail() && j.name.empty()) continue;
            addJunction(j);
        } else if (tag == 'R') {
            int a, b, d, t;
            if (ss >> a >> b >> d >> t) addRoad(a, b, d, t);
        }
    }
}

void City::addJunction(const Junction& j) {
    junctions_[j.id] = j;
}

void City::addRoad(int a, int b, int distance, int time) {
    roads_.push_back({a, b, distance, time, 1.0, false});
    roads_.push_back({b, a, distance, time, 1.0, false});
}

int City::findByName(const std::string& name) const {
    std::string target = toLower(name);
    for (const auto& entry : junctions_) {
        if (toLower(entry.second.name) == target) return entry.first;
    }
    return -1;
}

const std::string& City::nameOf(int id) const {
    static const std::string unknown = "unknown";
    auto it = junctions_.find(id);
    return it == junctions_.end() ? unknown : it->second.name;
}

bool City::hasJunction(int id) const {
    return junctions_.count(id) > 0;
}

bool City::position(int id, int& x, int& y) const {
    auto it = junctions_.find(id);
    if (it == junctions_.end()) return false;
    x = it->second.x;
    y = it->second.y;
    return true;
}

int City::junctionCount() const {
    return static_cast<int>(junctions_.size());
}

bool City::setRoadClosed(int a, int b, bool closed) {
    bool found = false;
    for (Road& r : roads_) {
        if ((r.from == a && r.to == b) || (r.from == b && r.to == a)) {
            r.closed = closed;
            found = true;
        }
    }
    return found;
}

std::vector<Road> City::uniqueRoads() const {
    std::vector<Road> out;
    for (const Road& r : roads_) {
        if (r.from < r.to) out.push_back(r);
    }
    return out;
}

std::vector<int> City::shortestPath(int start, int goal, int* seconds) const {
    if (!hasJunction(start) || !hasJunction(goal)) return {};

    std::map<int, double> dist;
    std::map<int, int> prev;
    using Entry = std::pair<double, int>;
    std::priority_queue<Entry, std::vector<Entry>, std::greater<Entry>> pq;

    dist[start] = 0.0;
    pq.push({0.0, start});

    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;
        if (u == goal) break;

        for (const Road& r : roads_) {
            if (r.from != u || r.closed) continue;
            double nd = d + r.baseTime * r.congestion;
            auto it = dist.find(r.to);
            if (it == dist.end() || nd < it->second) {
                dist[r.to] = nd;
                prev[r.to] = u;
                pq.push({nd, r.to});
            }
        }
    }

    if (!dist.count(goal)) return {};

    std::vector<int> path;
    for (int at = goal;; at = prev[at]) {
        path.push_back(at);
        if (at == start) break;
    }
    std::reverse(path.begin(), path.end());

    if (seconds) *seconds = static_cast<int>(dist[goal]);
    return path;
}

} // namespace resqnet