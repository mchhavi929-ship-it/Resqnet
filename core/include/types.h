#ifndef TYPES_H
#define TYPES_H

#ifdef __cplusplus
extern "C" {
#endif

#define INCIDENT_TYPE_COUNT 25
#define INF_SECONDS 1000000000

enum VehicleKind {
    VK_AMBULANCE, VK_FIRE_TRUCK, VK_POLICE, VK_RECOVERY,
    VK_HEAVY_RESCUE, VK_HELICOPTER, VK_RESCUE_BOAT, VK_RELIEF,
    VK_KIND_COUNT
};

const char* type_name(int t);
const int*  type_needs(int t);
int         type_weight(int t);
const char* type_precaution(int t);
const char* vehicle_kind_name(int k);

#ifdef __cplusplus
}
#endif

#endif