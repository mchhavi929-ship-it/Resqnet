#ifndef STORE_H
#define STORE_H

#include "disaster.h"

typedef struct {
    Disaster items[MAX_DISASTERS];
    int      count;
    int      nextId;
} Store;

void      store_init(Store* s);
int       store_load(Store* s, const char* path);
int       store_save(const Store* s, const char* path);
int       store_add(Store* s, Disaster d);
Disaster* store_find(Store* s, int id);

#endif