#include "CityGraph.h"
#include <queue>
#include <limits>
#include <algorithm>
#include <utility>
#include <functional>
#include <cctype>

static std::string toLower(std::string s) {
    for (char& c : s) c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
    return s;
}

void CityGraph::addJunction(const Junction& j) {
    junctions_[j.id] = j;
    if (adjacency_.find(j.id) == adjacency_.end()) adjacency_[j.id] = {};
}

void CityGraph::addRoad(const Road& r) {
    adjacency_[r.from].push_back(r);
    Road reverse = r;
    reverse.from = r.to;
    reverse.to = r.from;
    adjacency_[r.to].push_back(reverse);
}

bool CityGraph::hasJunction(NodeId id) const {
    return junctions_.find(id) != junctions_.end();
}

const Junction& CityGraph::getJunction(NodeId id) const {
    return junctions_.at(id);
}

const std::vector<Road>& CityGraph::getRoadsFrom(NodeId id) const {
    return adjacency_.at(id);
}

int CityGraph::junctionCount() const {
    return static_cast<int>(junctions_.size());
}

NodeId CityGraph::findJunctionByName(const std::string& name) const {
    std::string target = toLower(name);
    for (const auto& entry : junctions_) {
        if (toLower(entry.second.name) == target) return entry.first;
    }
    return INVALID_NODE;
}

std::string CityGraph::nameOf(NodeId id) const {
    if (!hasJunction(id)) return "unknown";
    return junctions_.at(id).name;
}

void CityGraph::setCongestion(NodeId from, NodeId to, double factor) {
    for (auto& r : adjacency_[from]) if (r.to == to) r.congestion = factor;
    for (auto& r : adjacency_[to])   if (r.to == from) r.congestion = factor;
}

void CityGraph::closeRoad(NodeId from, NodeId to) {
    for (auto& r : adjacency_[from]) if (r.to == to) r.isClosed = true;
    for (auto& r : adjacency_[to])   if (r.to == from) r.isClosed = true;
}

void CityGraph::reopenRoad(NodeId from, NodeId to) {
    for (auto& r : adjacency_[from]) if (r.to == to) r.isClosed = false;
    for (auto& r : adjacency_[to])   if (r.to == from) r.isClosed = false;
}

void CityGraph::blockJunction(NodeId id)   { junctions_[id].isBlocked = true; }
void CityGraph::unblockJunction(NodeId id) { junctions_[id].isBlocked = false; }

std::vector<NodeId> CityGraph::shortestPath(NodeId start, NodeId goal) const {
    if (!hasJunction(start) || !hasJunction(goal)) return {};
    if (junctions_.at(start).isBlocked || junctions_.at(goal).isBlocked) return {};

    std::unordered_map<NodeId, double> dist;
    std::unordered_map<NodeId, NodeId> previous;
    using Entry = std::pair<double, NodeId>;
    std::priority_queue<Entry, std::vector<Entry>, std::greater<Entry>> pq;

    dist[start] = 0.0;
    pq.push({0.0, start});

    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;
        if (u == goal) break;

        auto adjIt = adjacency_.find(u);
        if (adjIt == adjacency_.end()) continue;

        for (const Road& r : adjIt->second) {
            if (r.isClosed) continue;
            if (junctions_.at(r.to).isBlocked) continue;
            double nd = d + static_cast<double>(r.baseTime) * r.congestion;
            auto dIt = dist.find(r.to);
            if (dIt == dist.end() || nd < dIt->second) {
                dist[r.to] = nd;
                previous[r.to] = u;
                pq.push({nd, r.to});
            }
        }
    }

    if (dist.find(goal) == dist.end()) return {};

    std::vector<NodeId> path;
    for (NodeId at = goal; ; at = previous[at]) {
        path.push_back(at);
        if (at == start) break;
    }
    std::reverse(path.begin(), path.end());
    return path;
}

Seconds CityGraph::travelTime(NodeId start, NodeId goal) const {
    std::vector<NodeId> path = shortestPath(start, goal);
    if (path.empty()) return INFINITE_TIME;
    if (path.size() == 1) return 0;

    double total = 0.0;
    for (size_t i = 0; i + 1 < path.size(); ++i) {
        for (const Road& r : adjacency_.at(path[i])) {
            if (r.to == path[i + 1] && !r.isClosed) {
                total += static_cast<double>(r.baseTime) * r.congestion;
                break;
            }
        }
    }
    return static_cast<Seconds>(total);
}

bool CityGraph::isReachable(NodeId start, NodeId goal) const {
    if (!hasJunction(start) || !hasJunction(goal)) return false;
    if (junctions_.at(start).isBlocked || junctions_.at(goal).isBlocked) return false;
    if (start == goal) return true;

    std::unordered_map<NodeId, bool> visited;
    std::queue<NodeId> q;
    visited[start] = true;
    q.push(start);

    while (!q.empty()) {
        NodeId u = q.front();
        q.pop();
        auto adjIt = adjacency_.find(u);
        if (adjIt == adjacency_.end()) continue;
        for (const Road& r : adjIt->second) {
            if (r.isClosed) continue;
            if (junctions_.at(r.to).isBlocked) continue;
            if (visited.count(r.to)) continue;
            if (r.to == goal) return true;
            visited[r.to] = true;
            q.push(r.to);
        }
    }
    return false;
}