#include <iostream>
#include "DisasterQueue.h"

int main() {
    DisasterQueue q;
    q.push({1, DisasterType::Storm, 2, 3, 20, 0});
    q.push({2, DisasterType::Fire,  4, 8, 12, 0});

    std::cout << "Most urgent: disaster #" << q.pop().id << "\n";
    std::cout << "Next: disaster #" << q.pop().id << "\n";
    return 0;
}