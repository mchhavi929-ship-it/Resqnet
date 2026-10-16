#include "DisasterQueue.h"
#include <stdexcept>
#include <sstream>

double DisasterQueue::priorityScore(const Disaster& d, Seconds now) {
    Seconds waited = now - d.reportedAt;
    if (waited < 0) waited = 0;
    return d.severity * 10.0 + d.peopleAffected * 0.5 + waited * 0.01;
}

int DisasterQueue::bestIndex(Seconds now) const {
    int best = 0;
    double bestScore = priorityScore(incidents_[0], now);
    for (int i = 1; i < static_cast<int>(incidents_.size()); ++i) {
        double s = priorityScore(incidents_[i], now);
        if (s > bestScore) { bestScore = s; best = i; }
    }
    return best;
}

void DisasterQueue::push(const Disaster& d) {
    incidents_.push_back(d);
}

Disaster DisasterQueue::pop() {
    if (incidents_.empty()) throw std::runtime_error("pop on empty DisasterQueue");
    int idx = bestIndex(0);
    Disaster d = incidents_[idx];
    incidents_.erase(incidents_.begin() + idx);
    return d;
}

const Disaster& DisasterQueue::peek() const {
    if (incidents_.empty()) throw std::runtime_error("peek on empty DisasterQueue");
    return incidents_[bestIndex(0)];
}

bool DisasterQueue::empty() const { return incidents_.empty(); }

int DisasterQueue::size() const { return static_cast<int>(incidents_.size()); }

std::string describe(const Disaster& d) {
    static const char* names[] = {
        "Fire", "Flood", "Earthquake", "Road accident",
        "Building collapse", "Storm", "Hazardous incident"
    };
    std::ostringstream out;
    out << "Disaster #" << d.id << " - " << names[static_cast<int>(d.type)]
        << " at " << "junction " << d.location
        << ", severity " << d.severity
        << ", " << d.peopleAffected << " people affected";
    return out.str();
}