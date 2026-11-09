#ifndef STORAGE_HPP
#define STORAGE_HPP

#include <string>
#include <vector>

namespace resqnet {

void appendEventLog(const std::string& path, const std::string& line);
std::vector<std::string> readAllLines(const std::string& path);

} // namespace resqnet

#endif