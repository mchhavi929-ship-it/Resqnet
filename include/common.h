#ifndef COMMON_H
#define COMMON_H

typedef int NodeId;
typedef int VehicleId;
typedef int HospitalId;
typedef int DisasterId;
typedef int Seconds;

enum class DisasterType {
    Fire, Flood, Earthquake, RoadAccident, BuildingCollapse, Storm, HazardousIncident
};

enum class VehicleType {
    Ambulance, FireTruck, Police, RecoveryVehicle, HeavyRescue, Helicopter, RescueBoat, ReliefSupply
};

enum class VehicleState {
    Available, EnRoute, OnScene, ToHospital, Returning
};

const NodeId  INVALID_NODE  = -1;
const Seconds INFINITE_TIME = 1000000000;

#endif // COMMON_H