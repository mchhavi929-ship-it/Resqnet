#ifndef CITYGRAPH_H
#define CITYGRAPH_H

#include <vector>
#include <string>
#include <unordered_map>
#include "common.h"

struct Point {
    int x;
    int y;
};

struct Junction {
    NodeId      id;
    Point       position;
    bool        isBlocked;
    std::string name;
    std::string type;
};

struct Road {
    NodeId  from;
    NodeId  to;
    int     distance;
    Seconds baseTime;
    double  congestion;
    bool    isClosed;
};

class CityGraph {
public:
    void addJunction(const Junction& j);
    void addRoad(const Road& r);

    bool hasJunction(NodeId id) const;
    const Junction& getJunction(NodeId id) const;
    const std::vector<Road>& getRoadsFrom(NodeId id) const;
    int  junctionCount() const;

    NodeId      findJunctionByName(const std::string& name) const;
    std::string nameOf(NodeId id) const;

    void setCongestion(NodeId from, NodeId to, double factor);
    void closeRoad(NodeId from, NodeId to);
    void reopenRoad(NodeId from, NodeId to);
    void blockJunction(NodeId id);
    void unblockJunction(NodeId id);

    std::vector<NodeId> shortestPath(NodeId start, NodeId goal) const;
    Seconds travelTime(NodeId start, NodeId goal) const;
    bool isReachable(NodeId start, NodeId goal) const;

private:
    std::unordered_map<NodeId, Junction> junctions_;
    std::unordered_map<NodeId, std::vector<Road>> adjacency_;
};

#endif // CITYGRAPH_H