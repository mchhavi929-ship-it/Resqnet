#include "disaster.h"

double disaster_score(const Disaster* d) {
    return d->severity * 10.0 + d->peopleAffected * 0.5;
}

int disaster_best_open(const Disaster* items, int count) {
    int best = -1;
    for (int i = 0; i < count; ++i) {
        if (items[i].status != OPEN) continue;
        if (best == -1 || disaster_score(&items[i]) > disaster_score(&items[best])) best = i;
    }
    return best;
}

const char* disaster_status_name(int status) {
    static const char* names[] = { "OPEN", "DISPATCHED", "CLOSED" };
    if (status < 0 || status > 2) return "UNKNOWN";
    return names[status];
}