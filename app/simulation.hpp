#ifndef SIMULATION_HPP
#define SIMULATION_HPP

#include <ostream>
#include <queue>
#include <string>
#include <vector>
#include "graph.h"
#include "incident.h"
#include "vehicle.hpp"

namespace resqnet {

enum class EventKind { VehicleArrives, PatientDelivered };

struct Event {
    int time;
    EventKind kind;
    int incidentId;
    std::string text;

    bool operator>(const Event& other) const { return time > other.time; }
};

class Simulation {
public:
    void schedule(int time, EventKind kind, int incidentId, std::string text);
    void run(std::ostream& out);
    bool empty() const { return queue_.empty(); }

private:
    std::priority_queue<Event, std::vector<Event>, std::greater<Event>> queue_;
};

void planVehicles(Simulation& sim, const Graph& g, const VehicleList& vehicles, const Incident& inc);
int lastArrival(const Graph& g, const VehicleList& vehicles, const Incident& inc);

} // namespace resqnet

#endif