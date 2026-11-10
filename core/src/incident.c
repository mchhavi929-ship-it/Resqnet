#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "incident.h"
#include "types.h"

void inc_init(IncidentStore* s) {
    s->count = 0;
}

static int find_index(const IncidentStore* s, int id) {
    for (int i = 0; i < s->count; ++i) {
        if (s->items[i].id == id) return i;
    }
    return -1;
}

int inc_load(IncidentStore* s, const char* path) {
    inc_init(s);
    FILE* f = fopen(path, "r");
    if (!f) return 1;

    char line[2048];
    while (fgets(line, sizeof line, f)) {
        if (line[0] == 'I') {
            Incident inc;
            memset(&inc, 0, sizeof inc);
            int n = sscanf(line,
                "I %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %31[^|]",
                &inc.id, &inc.type, &inc.location, &inc.severity, &inc.people,
                &inc.status, &inc.delivered, &inc.nHosp,
                &inc.hosp[0], &inc.hosp[1], &inc.hosp[2], &inc.hosp[3],
                &inc.hospPat[0], &inc.hospPat[1], &inc.hospPat[2], &inc.hospPat[3],
                inc.reporter);
            if (n != 17) continue;

            for (int k = 0; k < INC_MAX_UNITS; ++k) inc.vehicles[k] = -1;
            inc.vcount = 0;

            char* bar = strchr(line, '|');
            if (bar) {
                strncpy(inc.note, bar + 1, INC_NOTE_LEN - 1);
                inc.note[strcspn(inc.note, "\r\n")] = '\0';
            }
            if (s->count < INC_MAX) s->items[s->count++] = inc;
        } else if (line[0] == 'U') {
            char* p = line + 1;
            int id  = (int)strtol(p, &p, 10);
            int cnt = (int)strtol(p, &p, 10);
            int idx = find_index(s, id);
            if (idx < 0) continue;

            Incident* inc = &s->items[idx];
            inc->vcount = 0;
            for (int k = 0; k < cnt; ++k) {
                long v = strtol(p, &p, 10);
                if (k < INC_MAX_UNITS) {
                    inc->vehicles[k] = (int)v;
                    inc->vcount = k + 1;
                }
            }
        }
    }
    fclose(f);
    return 1;
}

int inc_save(const IncidentStore* s, const char* path) {
    FILE* f = fopen(path, "w");
    if (!f) return 0;

    fprintf(f, "# I id type location severity people status delivered nHosp h0 h1 h2 h3 p0 p1 p2 p3 reporter|note\n");
    fprintf(f, "# U id count v0 v1 ... (fleet units assigned)\n");
    for (int i = 0; i < s->count; ++i) {
        const Incident* inc = &s->items[i];
        fprintf(f, "I %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %s|%s\n",
                inc->id, inc->type, inc->location, inc->severity, inc->people,
                inc->status, inc->delivered, inc->nHosp,
                inc->hosp[0], inc->hosp[1], inc->hosp[2], inc->hosp[3],
                inc->hospPat[0], inc->hospPat[1], inc->hospPat[2], inc->hospPat[3],
                inc->reporter, inc->note);
        fprintf(f, "U %d %d", inc->id, inc->vcount);
        for (int k = 0; k < inc->vcount; ++k) fprintf(f, " %d", inc->vehicles[k]);
        fprintf(f, "\n");
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
    inc.delivered = 0;
    inc.nHosp = 0;
    for (int k = 0; k < INC_MAX_HOSP; ++k) { inc.hosp[k] = -1; inc.hospPat[k] = 0; }
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
    static const char* names[] = { "REPORTED", "DISPATCHED", "ARRIVED", "RESOLVED", "RELEASED" };
    return names[status];
}