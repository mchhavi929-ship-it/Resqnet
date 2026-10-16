#ifndef RESOURCEPOOL_H
#define RESOURCEPOOL_H

#include <vector>
#include <string>
#include "common.h"
#include "CityGraph.h"

struct Vehicle {
    VehicleId    id;
    VehicleType  type;
    VehicleState state;
    NodeId       location;
    std::string  name;
};

class ResourcePool {
public:
    void addVehicle(const Vehicle& v);
    int  vehicleCount() const;

    // Returns the index of the best free vehicle of one of the required types, or -1.
    int findBestVehicle(const std::vector<VehicleType>& required,
                        NodeId incidentLocation,
                        const CityGraph& city) const;

    Vehicle& at(int index);
    const Vehicle& at(int index) const;

private:
    std::vector<Vehicle> vehicles_;
};

bool loadVehicles(const std::string& path, ResourcePool& pool);

#endif // RESOURCEPOOL_H