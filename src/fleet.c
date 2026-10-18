#include <stdio.h>
#include <string.h>
#include "fleet.h"

void fleet_init(Fleet* f) {
    memset(f, 0, sizeof(Fleet));
}

int fleet_parse_type(const char* s) {
    if (strcmp(s, "Ambulance") == 0)       return AMBULANCE;
    if (strcmp(s, "FireTruck") == 0)       return FIRE_TRUCK;
    if (strcmp(s, "Police") == 0)          return POLICE;
    if (strcmp(s, "RecoveryVehicle") == 0) return RECOVERY;
    if (strcmp(s, "HeavyRescue") == 0)     return HEAVY_RESCUE;
    if (strcmp(s, "Helicopter") == 0)      return HELICOPTER;
    if (strcmp(s, "RescueBoat") == 0)      return RESCUE_BOAT;
    if (strcmp(s, "ReliefSupply") == 0)    return RELIEF;
    return -1;
}

int fleet_load(const char* path, Fleet* f) {
    FILE* fp = fopen(path, "r");
    if (!fp) return 0;

    char line[256];
    while (fgets(line, sizeof(line), fp)) {
        if (line[0] == '#' || line[0] == '\n' || line[0] == '\r') continue;

        char tag;
        if (sscanf(line, " %c", &tag) != 1 || tag != 'V') continue;

        int  id, base;
        char typeStr[32];
        char name[NAME_LEN];
        if (sscanf(line, " V %d %31s %d %63s", &id, typeStr, &base, name) != 4) continue;

        int t = fleet_parse_type(typeStr);
        if (t < 0 || f->count >= MAX_VEHICLES) continue;

        Vehicle* v = &f->vehicles[f->count++];
        v->id = id;
        v->type = t;
        v->state = AVAILABLE;
        v->location = base;
        strncpy(v->name, name, NAME_LEN - 1);
        v->name[NAME_LEN - 1] = '\0';
    }
    fclose(fp);
    return 1;
}