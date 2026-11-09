#ifndef HOSPITAL_HPP
#define HOSPITAL_HPP

#include <string>
#include <vector>
#include "graph.h"

namespace resqnet {

struct Hospital {
    int id;
    int location;
    int totalBeds;
    int freeBeds;
    int capability;
    std::string name;
};

struct HospitalChoice {
    int index = -1;
    int secs = 0;
    std::vector<int> route;
};

std::vector<Hospital> loadHospitals(const std::string& path);
void saveHospitals(const std::vector<Hospital>& hs, const std::string& path);

int capabilityNeeded(int severity);

HospitalChoice selectHospital(const Graph& g, const std::vector<Hospital>& hs,
                              int from, int needCap);

bool admitPatient(std::vector<Hospital>& hs, int idx);
void dischargePatient(std::vector<Hospital>& hs, int idx);

} // namespace resqnet

#endif