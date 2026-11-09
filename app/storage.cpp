#include "storage.hpp"
#include <fstream>
#include <stdexcept>

namespace resqnet {

void appendEventLog(const std::string& path, const std::string& line) {
    std::ofstream out(path, std::ios::app);
    if (!out) throw std::runtime_error("Cannot write log: " + path);
    out << line << "\n";
}

std::vector<std::string> readAllLines(const std::string& path) {
    std::ifstream in(path);
    if (!in) throw std::runtime_error("Cannot read: " + path);

    std::vector<std::string> lines;
    std::string l;
    while (std::getline(in, l)) lines.push_back(l);
    return lines;
}

} // namespace resqnet