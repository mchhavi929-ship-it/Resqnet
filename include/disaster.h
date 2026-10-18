#ifndef DISASTER_H
#define DISASTER_H

#include "common.h"

typedef struct {
    int  id;
    int  type;
    int  location;
    int  severity;
    int  peopleAffected;
    int  reportedAt;
    int  status;
    char reporter[USER_LEN];
} Disaster;

double      disaster_score(const Disaster* d);
int         disaster_best_open(const Disaster* items, int count);
const char* disaster_status_name(int status);

#endif