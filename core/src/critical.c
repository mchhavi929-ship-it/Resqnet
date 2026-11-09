#include <string.h>
#include "critical.h"

typedef struct {
    const Graph* g;
    int disc[GRAPH_MAX_NODES + 1];
    int low[GRAPH_MAX_NODES + 1];
    int parent[GRAPH_MAX_NODES + 1];
    int ap[GRAPH_MAX_NODES + 1];
    int timer;
} ApState;

static void dfs(ApState* s, int u) {
    s->disc[u] = s->low[u] = ++s->timer;
    int children = 0;

    for (int i = 0; i < s->g->edgeCount; ++i) {
        const GraphEdge* e = &s->g->edges[i];
        if (e->from != u || e->closed) continue;
        int v = e->to;

        if (!s->disc[v]) {
            children++;
            s->parent[v] = u;
            dfs(s, v);
            if (s->low[v] < s->low[u]) s->low[u] = s->low[v];

            if (s->parent[u] == 0 && children > 1) s->ap[u] = 1;
            if (s->parent[u] != 0 && s->low[v] >= s->disc[u]) s->ap[u] = 1;
        } else if (v != s->parent[u]) {
            if (s->disc[v] < s->low[u]) s->low[u] = s->disc[v];
        }
    }
}

int critical_junctions(const Graph* g, int out[], int maxOut) {
    ApState s;
    memset(&s, 0, sizeof s);
    s.g = g;

    for (int id = 1; id <= GRAPH_MAX_NODES; ++id) {
        if (graph_has_node(g, id) && !s.disc[id]) {
            s.parent[id] = 0;
            dfs(&s, id);
        }
    }

    int n = 0;
    for (int id = 1; id <= GRAPH_MAX_NODES && n < maxOut; ++id) {
        if (s.ap[id]) out[n++] = id;
    }
    return n;
}