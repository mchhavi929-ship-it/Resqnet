#ifndef FLEET_H
#define FLEET_H

#include "common.h"

typedef struct {
    int  id;
    int  type;
    int  state;
    int  location;
    char name[NAME_LEN];
} Vehicle;

typedef struct {
    Vehicle vehicles[MAX_VEHICLES];
    int     count;
} Fleet;

void fleet_init(Fleet* f);
int  fleet_load(const char* path, Fleet* f);
int  fleet_parse_type(const char* s);

#endif