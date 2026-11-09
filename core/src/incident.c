#include <stdio.h>
#include <string.h>
#include "incident.h"
#include "types.h"

void inc_init(IncidentStore* s) {
    s->count = 0;
}

int inc_load(IncidentStore* s, const char* path) {
    inc_init(s);
    FILE* f = fopen(path, "r");
    if (!f) return 1;

    char line[900];
    while (fgets(line, sizeof line, f)) {
        if (line[0] != 'I') continue;

        Incident inc;
        memset(&inc, 0, sizeof inc);
        int n = sscanf(line,
            "I %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %31[^|]",
            &inc.id, &inc.type, &inc.location, &inc.severity, &inc.people,
            &inc.status, &inc.vcount,
            &inc.vehicles[0], &inc.vehicles[1], &inc.vehicles[2], &inc.vehicles[3],
            &inc.vehicles[4], &inc.vehicles[5], &inc.vehicles[6], &inc.vehicles[7],
            &inc.hospital, inc.reporter);
        if (n != 17) continue;

        char* bar = strchr(line, '|');
        if (bar) {
            strncpy(inc.note, bar + 1, INC_NOTE_LEN - 1);
            inc.note[strcspn(inc.note, "\r\n")] = '\0';
        }
        if (s->count < INC_MAX) s->items[s->count++] = inc;
    }
    fclose(f);
    return 1;
}

int inc_save(const IncidentStore* s, const char* path) {
    FILE* f = fopen(path, "w");
    if (!f) return 0;

    fprintf(f, "# I id type location severity people status vcount v0 v1 v2 v3 v4 v5 v6 v7 hospital reporter|note\n");
    for (int i = 0; i < s->count; ++i) {
        const Incident* inc = &s->items[i];
        fprintf(f, "I %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %s|%s\n",
                inc->id, inc->type, inc->location, inc->severity, inc->people,
                inc->status, inc->vcount,
                inc->vehicles[0], inc->vehicles[1], inc->vehicles[2], inc->vehicles[3],
                inc->vehicles[4], inc->vehicles[5], inc->vehicles[6], inc->vehicles[7],
                inc->hospital, inc->reporter, inc->note);
    }
    fclose(f);
    return 1;
}

int inc_add(IncidentStore* s, Incident inc) {
    if (s->count >= INC_MAX) return -1;

    int maxId = 0;
    for (int i = 0; i < s->count; ++i) {
        if (s->items[i].id > maxId) maxId = s->items[i].id;
    }
    inc.id = maxId + 1;
    inc.status = INC_REPORTED;
    inc.vcount = 0;
    inc.hospital = -1;
    for (int k = 0; k < INC_MAX_UNITS; ++k) inc.vehicles[k] = -1;

    s->items[s->count++] = inc;
    return inc.id;
}

double inc_priority(const Incident* inc) {
    return inc->severity * 10.0 + inc->people * 0.5 + type_weight(inc->type);
}

int inc_best_pending(const IncidentStore* s, const int skip[]) {
    int best = -1;
    double bestScore = -1.0;
    for (int i = 0; i < s->count; ++i) {
        if (s->items[i].status != INC_REPORTED || skip[i]) continue;
        double sc = inc_priority(&s->items[i]);
        if (sc > bestScore) {
            bestScore = sc;
            best = i;
        }
    }
    return best;
}

const char* inc_status_name(int status) {
    static const char* names[] = { "REPORTED", "DISPATCHED", "ARRIVED", "RESOLVED" };
    return names[status];
}