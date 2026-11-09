#ifndef ROADS_H
#define ROADS_H

#include "graph.h"

#ifdef __cplusplus
extern "C" {
#endif

int roads_save(const Graph* g, const char* path);
int roads_load(Graph* g, const char* path);

#ifdef __cplusplus
}
#endif

#endif