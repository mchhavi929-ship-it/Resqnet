#ifndef INCIDENT_H
#define INCIDENT_H

#include "common.h"

typedef struct {
    int  id;
    int  type;              /* 0 to 23, see incident_type_name() */
    int  severity;          /* 1 (minor) to 10 (critical) */
    int  people;            /* people affected */
    char status[16];        /* REPORTED, DISPATCHED, RESOLVED */
    char team[STR_LEN];
    char location[STR_LEN];
    char reporter[STR_LEN];
    char details[STR_LEN];
} Incident;

struct Store;

const char* incident_type_name(int t);
const char* incident_precaution(int t);
int         incident_add(struct Store* s, int type, int severity, int people,
                         const char* location, const char* reporter, const char* details);
Incident*   incident_find(struct Store* s, int id);
int         incident_sorted(const struct Store* s, int order[]);

#endif