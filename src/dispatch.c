#include <stdio.h>
#include <math.h>
#include "dispatch.h"
#include "types.h"

static int heli_seconds(const City* c, int from, int to) {
    double dx = c->junctions[from].x - c->junctions[to].x;
    double dy = c->junctions[from].y - c->junctions[to].y;
    double metres = sqrt(dx * dx + dy * dy) * 10.0;
    return (int)(metres / HELI_SPEED_MPS);
}

int vehicle_eta(const City* c, const Vehicle* v, int target, int path[], int* n) {
    *n = 0;
    if (v->type == HELICOPTER) {
        return heli_seconds(c, v->location, target);
    }
    int secs = 0;
    int cnt = city_shortest_path(c, v->location, target, path, MAX_JUNCTIONS, &secs);
    if (cnt == 0) return -1;
    *n = cnt;
    return secs;
}

void print_vehicle_line(const City* c, const Vehicle* v, int target) {
    int path[MAX_JUNCTIONS];
    int n = 0;
    int secs = vehicle_eta(c, v, target, path, &n);

    printf("  [GO] %s (%s) from %s\n", v->name, vehicle_type_name(v->type),
           city_name(c, v->location));
    if (secs < 0) {
        printf("       Route   : no road route available\n");
        return;
    }
    if (v->type == HELICOPTER) {
        printf("       Route   : direct flight (ignores roads)\n");
    } else {
        printf("       Route   : ");
        for (int i = 0; i < n; ++i) {
            printf("%s", city_name(c, path[i]));
            if (i + 1 < n) printf(" -> ");
        }
        printf("\n");
    }
    printf("       ETA     : %d s (about %d min)\n", secs, (secs + 59) / 60);
}

static int find_best(const City* c, const Fleet* f, const int busy[], int type, int target) {
    int best = -1;
    int bestTime = INF_TIME;
    for (int i = 0; i < f->count; ++i) {
        const Vehicle* v = &f->vehicles[i];
        if (busy[i] || v->type != type) continue;

        int path[MAX_JUNCTIONS];
        int n = 0;
        int t = vehicle_eta(c, v, target, path, &n);
        if (t < 0) continue;
        if (t < bestTime) {
            bestTime = t;
            best = i;
        }
    }
    return best;
}

void dispatch_incident(const City* c, const Fleet* f, IncidentStore* s, int idx) {
    Incident* inc = &s->items[idx];

    int busy[MAX_VEHICLES];
    for (int i = 0; i < MAX_VEHICLES; ++i) busy[i] = 0;
    for (int i = 0; i < s->count; ++i) {
        if (s->items[i].status != DISPATCHED) continue;
        for (int k = 0; k < s->items[i].vehicleCount; ++k) {
            busy[s->items[i].vehicles[k]] = 1;
        }
    }

    printf("\nDispatching #%d: %s at %s\n", inc->id, type_name(inc->type),
           city_name(c, inc->location));

    const int* need = needs_for(inc->type);
    inc->vehicleCount = 0;
    for (int k = 0; k < 4 && need[k] != -1; ++k) {
        int vi = find_best(c, f, busy, need[k], inc->location);
        if (vi < 0) {
            printf("  [--] No free %s right now\n", vehicle_type_name(need[k]));
            continue;
        }
        busy[vi] = 1;
        inc->vehicles[inc->vehicleCount++] = vi;
        print_vehicle_line(c, &f->vehicles[vi], inc->location);
    }

    if (inc->vehicleCount > 0) {
        inc->status = DISPATCHED;
        printf("  Status: DISPATCHED\n");
    } else {
        printf("  Status: still REPORTED (will retry when a vehicle is free)\n");
    }
}