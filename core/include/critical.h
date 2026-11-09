#ifndef CRITICAL_H
#define CRITICAL_H

#include "graph.h"

#ifdef __cplusplus
extern "C" {
#endif

int critical_junctions(const Graph* g, int out[], int maxOut);

#ifdef __cplusplus
}
#endif

#endif