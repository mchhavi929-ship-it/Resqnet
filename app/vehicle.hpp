#ifndef VEHICLE_HPP
#define VEHICLE_HPP

#include <memory>
#include <ostream>
#include <string>
#include <vector>
#include "graph.h"
#include "fleet.h"

namespace resqnet {

class Vehicle {
public:
    Vehicle(int id, int kind, int base, std::string name);
    virtual ~Vehicle() = default;

    virtual int eta(const Graph& g, int target, std::vector<int>& route) const = 0;
    virtual std::string mode() const = 0;

    int id() const { return id_; }
    int kind() const { return kind_; }
    int location() const { return location_; }
    const std::string& name() const { return name_; }

    static std::unique_ptr<Vehicle> make(const FleetVehicle& fv);

    friend std::ostream& operator<<(std::ostream& out, const Vehicle& v);

protected:
    int id_;
    int kind_;
    int location_;
    std::string name_;
};

class RoadVehicle final : public Vehicle {
public:
    using Vehicle::Vehicle;
    int eta(const Graph& g, int target, std::vector<int>& route) const override;
    std::string mode() const override { return "road"; }
};

class Helicopter final : public Vehicle {
public:
    using Vehicle::Vehicle;
    int eta(const Graph& g, int target, std::vector<int>& route) const override;
    std::string mode() const override { return "air, straight line"; }
};

using VehicleList = std::vector<std::unique_ptr<Vehicle>>;

} // namespace resqnet

#endif