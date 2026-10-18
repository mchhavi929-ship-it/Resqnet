#include <stdio.h>
#include <string.h>
#include "store.h"

void store_init(Store* s) {
    s->count = 0;
    s->nextId = 1;
}

int store_load(Store* s, const char* path) {
    FILE* f = fopen(path, "r");
    if (!f) return 0;

    Disaster d;
    while (fscanf(f, "%d %d %d %d %d %d %d %31s",
                  &d.id, &d.type, &d.location, &d.severity,
                  &d.peopleAffected, &d.reportedAt, &d.status, d.reporter) == 8) {
        if (s->count < MAX_DISASTERS) s->items[s->count++] = d;
        if (d.id >= s->nextId) s->nextId = d.id + 1;
    }
    fclose(f);
    return 1;
}

int store_save(const Store* s, const char* path) {
    FILE* f = fopen(path, "w");
    if (!f) return 0;
    for (int i = 0; i < s->count; ++i) {
        const Disaster* d = &s->items[i];
        fprintf(f, "%d %d %d %d %d %d %d %s\n",
                d->id, d->type, d->location, d->severity,
                d->peopleAffected, d->reportedAt, d->status, d->reporter);
    }
    fclose(f);
    return 1;
}

int store_add(Store* s, Disaster d) {
    if (s->count >= MAX_DISASTERS) return -1;
    d.id = s->nextId++;
    s->items[s->count++] = d;
    return d.id;
}

Disaster* store_find(Store* s, int id) {
    for (int i = 0; i < s->count; ++i) {
        if (s->items[i].id == id) return &s->items[i];
    }
    return NULL;
}