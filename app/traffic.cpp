#include "traffic.hpp"
#include <fstream>
#include <sstream>

namespace resqnet {

int loadTraffic(Graph& g, const std::string& path) {
    for (int i = 0; i < g.edgeCount; ++i) g.edges[i].congestion = 1.0;

    std::ifstream in(path);
    if (!in) return 0;

    int changed = 0;
    std::string line;
    while (std::getline(in, line)) {
        if (line.empty() || line[0] != 'T') continue;

        std::istringstream ss(line);
        char tag;
        int a, b;
        double factor;
        if (!(ss >> tag >> a >> b >> factor) || factor <= 0.0) continue;

        for (int i = 0; i < g.edgeCount; ++i) {
            GraphEdge& e = g.edges[i];
            if ((e.from == a && e.to == b) || (e.from == b && e.to == a)) {
                e.congestion = factor;
                changed++;
            }
        }
    }
    return changed;
}

} // namespace resqnet