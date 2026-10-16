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

    int findBestVehicle(const std::vector<VehicleType>& required,
                        NodeId incidentLocation,
                        const CityGraph& city) const;

    Vehicle& at(int index);
    const Vehicle& at(int index) const;

    // Travel time for one vehicle (helicopters fly straight)
    Seconds travelSeconds(const Vehicle& v, NodeId target, const CityGraph& city) const;

private:
    std::vector<Vehicle> vehicles_;
};

bool loadVehicles(const std::string& path, ResourcePool& pool);

#endif // RESOURCEPOOL_H