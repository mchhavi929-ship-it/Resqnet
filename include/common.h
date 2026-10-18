#ifndef COMMON_H
#define COMMON_H

#define MAX_JUNCTIONS   50
#define MAX_ROADS       200
#define MAX_VEHICLES    50
#define MAX_DISASTERS   500
#define NAME_LEN        64
#define USER_LEN        32
#define INF_TIME        1000000000
#define HELI_SPEED_MPS  16.7

enum VehicleType {
    AMBULANCE, FIRE_TRUCK, POLICE, RECOVERY, HEAVY_RESCUE, HELICOPTER, RESCUE_BOAT, RELIEF
};

enum VehicleState {
    AVAILABLE, EN_ROUTE, ON_SCENE, TO_HOSPITAL, RETURNING
};

enum IncidentStatus {
    OPEN, DISPATCHED, CLOSED
};

#endif