#include <stdio.h>
#include <string.h>
#include "fleet.h"
#include "types.h"

static int parse_kind(const char* s) {
    static const char* names[VK_KIND_COUNT] = {
        "Ambulance", "FireTruck", "Police", "RecoveryVehicle",
        "HeavyRescue", "Helicopter", "RescueBoat", "ReliefSupply"
    };
    for (int i = 0; i < VK_KIND_COUNT; ++i) {
        if (strcmp(s, names[i]) == 0) return i;
    }
    return -1;
}

int fleet_load(Fleet* f, const char* path) {
    f->count = 0;
    FILE* fp = fopen(path, "r");
    if (!fp) return 0;

    char line[256];
    while (fgets(line, sizeof line, fp)) {
        if (line[0] == '#' || line[0] == '\n' || line[0] == '\r') continue;

        int  id, base;
        char kind[32];
        char name[FLEET_NAME_LEN];
        if (sscanf(line, " V %d %31s %d %63s", &id, kind, &base, name) != 4) continue;

        int k = parse_kind(kind);
        if (k < 0 || f->count >= FLEET_MAX) continue;

        FleetVehicle* v = &f->v[f->count++];
        v->id = id;
        v->kind = k;
        v->base = base;
        strncpy(v->name, name, FLEET_NAME_LEN - 1);
        v->name[FLEET_NAME_LEN - 1] = '\0';
    }
    fclose(fp);
    return 1;
}