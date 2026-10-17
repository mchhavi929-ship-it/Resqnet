#include <string.h>
#include "disaster.h"

double disaster_score(const Disaster* d, const DisasterScoreWeights* weights) {
    return d->severity * weights->severityWeight +
           d->peopleAffected * weights->peopleAffectedWeight;
}

int disaster_pop_best(DisasterList* list, Disaster* out,
                      const DisasterScoreWeights* weights) {
    if (list->count == 0) return 0;

    int best = 0;
    for (int i = 1; i < list->count; ++i) {
        if (disaster_score(&list->items[i], weights) >
            disaster_score(&list->items[best], weights)) best = i;
    }

    *out = list->items[best];
    for (int i = best; i < list->count - 1; ++i) {
        list->items[i] = list->items[i + 1];
    }
    list->count--;
    return 1;
}

const char* disaster_type_name(int type) {
    static const char* names[] = {
        "Fire", "Flood", "Earthquake", "Road accident",
        "Building collapse", "Storm", "Hazardous incident"
    };
    return names[type];
}