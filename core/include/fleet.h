#ifndef FLEET_H
#define FLEET_H

#ifdef __cplusplus
extern "C" {
#endif

#define FLEET_MAX      100
#define FLEET_NAME_LEN 64

typedef struct {
    int  id;
    int  kind;
    int  base;
    char name[FLEET_NAME_LEN];
} FleetVehicle;

typedef struct {
    FleetVehicle v[FLEET_MAX];
    int          count;
} Fleet;

int fleet_load(Fleet* f, const char* path);

#ifdef __cplusplus
}
#endif

#endif