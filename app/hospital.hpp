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

/* Nearest hospital with a free bed and enough capability. index -1 if none. */
HospitalChoice selectHospital(const Graph& g, const std::vector<Hospital>& hs,
                              int from, int needCap);

/* All hospitals with free beds and enough capability, nearest first. */
std::vector<HospitalChoice> rankHospitals(const Graph& g, const std::vector<Hospital>& hs,
                                          int from, int needCap);

/* Admits up to 'wanted' patients, limited by free beds. Returns number admitted. */
int admitPatients(std::vector<Hospital>& hs, int idx, int wanted);
void dischargePatients(std::vector<Hospital>& hs, int idx, int count);

bool admitPatient(std::vector<Hospital>& hs, int idx);
void dischargePatient(std::vector<Hospital>& hs, int idx);

} // namespace resqnet

#endif