#include "hospital.hpp"
#include <algorithm>
#include <fstream>
#include <sstream>
#include <stdexcept>
#include "types.h"

namespace resqnet {

namespace {
std::string trimmed(const std::string& s) {
    const char* ws = " \t\r\n";
    auto b = s.find_first_not_of(ws);
    if (b == std::string::npos) return "";
    auto e = s.find_last_not_of(ws);
    return s.substr(b, e - b + 1);
}
}

std::vector<Hospital> loadHospitals(const std::string& path) {
    std::ifstream in(path);
    if (!in) throw std::runtime_error("Cannot open hospitals file: " + path);

    std::vector<Hospital> out;
    std::string line;
    while (std::getline(in, line)) {
        if (line.empty() || line[0] != 'H') continue;

        std::istringstream ss(line);
        char tag;
        Hospital h{};
        ss >> tag >> h.id >> h.location >> h.totalBeds >> h.freeBeds >> h.capability;
        if (ss.fail()) continue;

        std::getline(ss, h.name);
        h.name = trimmed(h.name);
        out.push_back(h);
    }
    return out;
}

void saveHospitals(const std::vector<Hospital>& hs, const std::string& path) {
    std::ofstream out(path);
    if (!out) throw std::runtime_error("Cannot write hospitals file: " + path);
    out << "# H id location total_beds free_beds capability name\n";
    for (const Hospital& h : hs) {
        out << "H " << h.id << " " << h.location << " " << h.totalBeds << " "
            << h.freeBeds << " " << h.capability << " " << h.name << "\n";
    }
}

int capabilityNeeded(int severity) {
    if (severity >= 8) return 4;
    if (severity >= 5) return 2;
    return 1;
}

std::vector<HospitalChoice> rankHospitals(const Graph& g, const std::vector<Hospital>& hs,
                                          int from, int needCap) {
    std::vector<HospitalChoice> out;
    for (std::size_t i = 0; i < hs.size(); ++i) {
        const Hospital& h = hs[i];
        if (h.freeBeds <= 0 || h.capability < needCap) continue;

        int path[GRAPH_MAX_NODES];
        int t = 0;
        int n = graph_shortest_path(&g, from, h.location, path, GRAPH_MAX_NODES, &t);
        if (n == 0) continue;

        HospitalChoice c;
        c.index = static_cast<int>(i);
        c.secs = t;
        c.route.assign(path, path + n);
        out.push_back(c);
    }
    std::sort(out.begin(), out.end(),
              [](const HospitalChoice& a, const HospitalChoice& b) { return a.secs < b.secs; });
    return out;
}

HospitalChoice selectHospital(const Graph& g, const std::vector<Hospital>& hs,
                              int from, int needCap) {
    std::vector<HospitalChoice> all = rankHospitals(g, hs, from, needCap);
    if (all.empty()) return HospitalChoice{};
    return all.front();
}

int admitPatients(std::vector<Hospital>& hs, int idx, int wanted) {
    if (idx < 0 || idx >= static_cast<int>(hs.size()) || wanted <= 0) return 0;
    int n = std::min(wanted, hs[idx].freeBeds);
    hs[idx].freeBeds -= n;
    return n;
}

void dischargePatients(std::vector<Hospital>& hs, int idx, int count) {
    if (idx < 0 || idx >= static_cast<int>(hs.size()) || count <= 0) return;
    hs[idx].freeBeds = std::min(hs[idx].totalBeds, hs[idx].freeBeds + count);
}

bool admitPatient(std::vector<Hospital>& hs, int idx) {
    return admitPatients(hs, idx, 1) == 1;
}

void dischargePatient(std::vector<Hospital>& hs, int idx) {
    dischargePatients(hs, idx, 1);
}

} // namespace resqnet