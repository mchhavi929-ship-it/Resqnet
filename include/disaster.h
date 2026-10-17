#ifndef DISASTER_H
#define DISASTER_H

#include "common.h"

typedef struct {
    int id;
    int type;
    int location;
    int severity;
    int peopleAffected;
    int reportedAt;
} Disaster;

typedef struct {
    Disaster items[MAX_DISASTERS];
    int      count;
} DisasterList;

typedef struct {
    double severityWeight;
    double peopleAffectedWeight;
} DisasterScoreWeights;

double      disaster_score(const Disaster* d, const DisasterScoreWeights* weights);
int         disaster_pop_best(DisasterList* list, Disaster* out,
                              const DisasterScoreWeights* weights);
const char* disaster_type_name(int type);

#endif