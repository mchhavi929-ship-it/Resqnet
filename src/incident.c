#include <stdio.h>
#include <string.h>
#include "incident.h"

void store_init(IncidentStore* s) {
    s->count = 0;
}

int store_load(const char* path, IncidentStore* s) {
    store_init(s);
    FILE* f = fopen(path, "r");
    if (!f) return 1;

    char line[512];
    while (fgets(line, sizeof line, f)) {
        if (line[0] != 'I') continue;

        Incident inc;
        memset(&inc, 0, sizeof inc);
        int n = sscanf(line, "I %d %d %d %d %d %d %d %d %d %d %d %31[^|]",
                       &inc.id, &inc.type, &inc.location, &inc.severity, &inc.people,
                       &inc.status, &inc.vehicleCount,
                       &inc.vehicles[0], &inc.vehicles[1], &inc.vehicles[2], &inc.vehicles[3],
                       inc.reporter);
        if (n != 12) continue;

        char* bar = strchr(line, '|');
        if (bar) {
            strncpy(inc.description, bar + 1, DESC_LEN - 1);
            inc.description[strcspn(inc.description, "\r\n")] = '\0';
        }
        if (s->count < MAX_INCIDENTS) s->items[s->count++] = inc;
    }
    fclose(f);
    return 1;
}

int store_save(const char* path, const IncidentStore* s) {
    FILE* f = fopen(path, "w");
    if (!f) return 0;

    fprintf(f, "%s\n", INCIDENT_FILE_HEADER);
    for (int i = 0; i < s->count; ++i) {
        const Incident* inc = &s->items[i];
        fprintf(f, "I %d %d %d %d %d %d %d %d %d %d %d %s|%s\n",
                inc->id, inc->type, inc->location, inc->severity, inc->people,
                inc->status, inc->vehicleCount,
                inc->vehicles[0], inc->vehicles[1], inc->vehicles[2], inc->vehicles[3],
                inc->reporter, inc->description);
    }
    fclose(f);
    return 1;
}

int store_add(IncidentStore* s, Incident inc) {
    if (s->count >= MAX_INCIDENTS) return -1;

    int maxId = 0;
    for (int i = 0; i < s->count; ++i) {
        if (s->items[i].id > maxId) maxId = s->items[i].id;
    }
    inc.id = maxId + 1;
    inc.status = REPORTED;
    inc.vehicleCount = 0;
    for (int k = 0; k < 4; ++k) inc.vehicles[k] = -1;

    s->items[s->count++] = inc;
    return inc.id;
}

double priority_score(const Incident* inc) {
    return inc->severity * 10.0 + inc->people * 0.5;
}

int store_best_pending(const IncidentStore* s, const int skip[]) {
    int best = -1;
    double bestScore = -1.0;
    for (int i = 0; i < s->count; ++i) {
        if (s->items[i].status != REPORTED || skip[i]) continue;
        double sc = priority_score(&s->items[i]);
        if (sc > bestScore) {
            bestScore = sc;
            best = i;
        }
    }
    return best;
}

const char* status_name(int status) {
    static const char* names[] = { "REPORTED", "DISPATCHED", "RESOLVED" };
    return names[status];
}