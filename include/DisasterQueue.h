#ifndef DISASTERQUEUE_H
#define DISASTERQUEUE_H

#include <vector>
#include <string>
#include "common.h"

struct Disaster {
    DisasterId   id;
    DisasterType type;
    NodeId       location;
    int          severity;
    int          peopleAffected;
    Seconds      reportedAt;
};

class DisasterQueue {
public:
    void push(const Disaster& d);
    Disaster pop();
    const Disaster& peek() const;
    bool empty() const;
    int  size() const;

    static double priorityScore(const Disaster& d, Seconds now);

private:
    std::vector<Disaster> incidents_;
    int bestIndex(Seconds now) const;
};

std::string describe(const Disaster& d);

#endif // DISASTERQUEUE_H