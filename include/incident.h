#ifndef INCIDENT_H
#define INCIDENT_H

#include "common.h"

typedef struct {
    int  id;
    int  type;
    int  location;
    int  severity;
    int  people;
    int  status;
    int  vehicleCount;
    int  vehicles[4];
    char reporter[USER_LEN];
    char description[DESC_LEN];
} Incident;

typedef struct {
    Incident items[MAX_INCIDENTS];
    int      count;
} IncidentStore;

#define INCIDENT_FILE_HEADER "# I id type location severity people status vcount v0 v1 v2 v3 reporter|description"

void store_init(IncidentStore* s);
int  store_load(const char* path, IncidentStore* s);
int  store_save(const char* path, const IncidentStore* s);
int  store_add(IncidentStore* s, Incident inc);
double priority_score(const Incident* inc);
int  store_best_pending(const IncidentStore* s, const int skip[]);
const char* status_name(int status);

#endif