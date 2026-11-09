#include <stdio.h>
#include "roads.h"

int roads_save(const Graph* g, const char* path) {
    FILE* f = fopen(path, "w");
    if (!f) return 0;

    fprintf(f, "# C a b  (closed road)\n");
    for (int i = 0; i < g->edgeCount; ++i) {
        const GraphEdge* e = &g->edges[i];
        if (e->closed && e->from < e->to) fprintf(f, "C %d %d\n", e->from, e->to);
    }
    fclose(f);
    return 1;
}

int roads_load(Graph* g, const char* path) {
    FILE* f = fopen(path, "r");
    if (!f) return 0;

    int applied = 0;
    char line[64];
    while (fgets(line, sizeof line, f)) {
        int a, b;
        if (sscanf(line, " C %d %d", &a, &b) == 2) {
            applied += graph_set_closed(g, a, b, 1) ? 1 : 0;
        }
    }
    fclose(f);
    return applied;
}