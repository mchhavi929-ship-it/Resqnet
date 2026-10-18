#ifndef STORE_H
#define STORE_H

#include "common.h"
#include "user.h"
#include "incident.h"

typedef struct Store {
    User     users[MAX_USERS];
    int      userCount;
    Incident incidents[MAX_INCIDENTS];
    int      incidentCount;
    int      nextIncidentId;
} Store;

void store_init(Store* s);
int  store_load(Store* s, const char* path);
int  store_save(const Store* s, const char* path);

#endif