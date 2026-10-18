#include <stdio.h>
#include <math.h>
#include "dispatch.h"
#include "incident.h"

static int heli_seconds(const City* c, int from, int to) {
    double dx = c->junctions[from].x - c->junctions[to].x;
    double dy = c->junctions[from].y - c->junctions[to].y;
    double metres = sqrt(dx * dx + dy * dy) * 10.0;
    return (int)(metres / HELI_SPEED_MPS);
}

static int find_best(const Fleet* f, const City* c, int t, int target) {
    int best = -1;
    int bestTime = INF_TIME;

    for (int i = 0; i < f->count; ++i) {
        const Vehicle* v = &f->vehicles[i];
        if (v->state != AVAILABLE || v->type != t) continue;

        int secs = 0;
        if (v->type == HELICOPTER) {
            secs = heli_seconds(c, v->location, target);
        } else {
            int path[MAX_JUNCTIONS];
            if (city_shortest_path(c, v->location, target, path, MAX_JUNCTIONS, &secs) == 0) continue;
        }
        if (secs < bestTime) {
            bestTime = secs;
            best = i;
        }
    }
    return best;
}

int dispatch_incident(const City* c, Fleet* f, const Disaster* d) {
    const int* needed = incident_needs(d->type);
    int sent = 0;

    for (int k = 0; k < 5 && needed[k] != -1; ++k) {
        int idx = find_best(f, c, needed[k], d->location);
        if (idx < 0) {
            printf("  [--] No free vehicle of the required type\n");
            continue;
        }

        Vehicle* v = &f->vehicles[idx];
        int path[MAX_JUNCTIONS];
        int secs = 0;

        printf("  [GO] %s  (from %s)\n", v->name, city_name(c, v->location));
        if (v->type == HELICOPTER) {
            secs = heli_seconds(c, v->location, d->location);
            printf("       Route   : direct flight (ignores roads)\n");
        } else {
            int n = city_shortest_path(c, v->location, d->location, path, MAX_JUNCTIONS, &secs);
            printf("       Route   : ");
            for (int i = 0; i < n; ++i) {
                printf("%s", city_name(c, path[i]));
                if (i + 1 < n) printf(" -> ");
            }
            printf("\n");
        }
        printf("       Arrives : %d s  -  ON SCENE\n", secs);

        v->state = ON_SCENE;
        v->location = d->location;
        sent++;
    }
    return sent;
}