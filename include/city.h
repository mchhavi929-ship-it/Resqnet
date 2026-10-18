#ifndef CITY_H
#define CITY_H

#include "common.h"

typedef struct {
    int  id;
    int  x, y;
    int  isBlocked;
    char type[16];
    char name[NAME_LEN];
} Junction;

typedef struct {
    int    from, to;
    int    distance;
    int    baseTime;
    double congestion;
    int    isClosed;
} Road;

typedef struct {
    Junction junctions[MAX_JUNCTIONS + 1];
    int      hasJunction[MAX_JUNCTIONS + 1];
    Road     roads[MAX_ROADS];
    int      roadCount;
} City;

void city_init(City* c);
int  city_load(const char* path, City* c);
void city_add_road(City* c, int from, int to, int distance, int time);
int  city_find_by_name(const City* c, const char* name);
const char* city_name(const City* c, int id);
void city_close_road(City* c, int a, int b);
void city_set_congestion(City* c, int a, int b, double factor);

int city_shortest_path(const City* c, int start, int goal,
                       int path[], int maxPath, int* seconds);

#endif