#include <stdio.h>
#include <string.h>
#include <ctype.h>
#include "graph.h"

void graph_init(Graph* g) {
    memset(g, 0, sizeof(Graph));
}

static void trim_inplace(char* s) {
    size_t n = strlen(s);
    while (n > 0 && (s[n-1] == ' ' || s[n-1] == '\t' || s[n-1] == '\r' || s[n-1] == '\n')) {
        s[--n] = '\0';
    }
    char* p = s;
    while (*p == ' ' || *p == '\t') p++;
    if (p != s) memmove(s, p, strlen(p) + 1);
}

static int name_equal_ci(const char* a, const char* b) {
    while (*a && *b) {
        if (tolower((unsigned char)*a) != tolower((unsigned char)*b)) return 0;
        a++;
        b++;
    }
    return *a == '\0' && *b == '\0';
}

void graph_add_node(Graph* g, int id, int x, int y, const char* type, const char* name) {
    if (id < 1 || id > GRAPH_MAX_NODES) return;
    GraphNode* n = &g->nodes[id];
    n->id = id;
    n->x = x;
    n->y = y;
    n->present = 1;
    strncpy(n->type, type, sizeof n->type - 1);
    n->type[sizeof n->type - 1] = '\0';
    strncpy(n->name, name, GRAPH_NAME_LEN - 1);
    n->name[GRAPH_NAME_LEN - 1] = '\0';
    trim_inplace(n->name);
}

void graph_add_edge(Graph* g, int a, int b, int baseTime) {
    if (g->edgeCount + 2 > GRAPH_MAX_EDGES) return;
    GraphEdge* e1 = &g->edges[g->edgeCount++];
    e1->from = a; e1->to = b; e1->baseTime = baseTime;
    e1->congestion = 1.0; e1->closed = 0;

    GraphEdge* e2 = &g->edges[g->edgeCount++];
    e2->from = b; e2->to = a; e2->baseTime = baseTime;
    e2->congestion = 1.0; e2->closed = 0;
}

int graph_load(Graph* g, const char* path) {
    FILE* f = fopen(path, "r");
    if (!f) return 0;

    char line[256];
    while (fgets(line, sizeof line, f)) {
        if (line[0] == '#' || line[0] == '\n' || line[0] == '\r') continue;

        if (line[0] == 'J') {
            int id, x, y, off = 0;
            char type[16];
            if (sscanf(line, " J %d %d %d %15s %n", &id, &x, &y, type, &off) >= 4) {
                graph_add_node(g, id, x, y, type, line + off);
            }
        } else if (line[0] == 'R') {
            int a, b, dist, time;
            if (sscanf(line, " R %d %d %d %d", &a, &b, &dist, &time) == 4) {
                graph_add_edge(g, a, b, time);
            }
        }
    }
    fclose(f);
    return 1;
}

int graph_has_node(const Graph* g, int id) {
    return id >= 1 && id <= GRAPH_MAX_NODES && g->nodes[id].present;
}

const char* graph_name(const Graph* g, int id) {
    if (!graph_has_node(g, id)) return "unknown";
    return g->nodes[id].name;
}

int graph_find_by_name(const Graph* g, const char* name) {
    for (int id = 1; id <= GRAPH_MAX_NODES; ++id) {
        if (g->nodes[id].present && name_equal_ci(g->nodes[id].name, name)) return id;
    }
    return -1;
}

int graph_set_closed(Graph* g, int a, int b, int closed) {
    int found = 0;
    for (int i = 0; i < g->edgeCount; ++i) {
        GraphEdge* e = &g->edges[i];
        if ((e->from == a && e->to == b) || (e->from == b && e->to == a)) {
            e->closed = closed;
            found = 1;
        }
    }
    return found;
}

int graph_shortest_path(const Graph* g, int start, int goal,
                        int path[], int maxPath, int* seconds) {
    double dist[GRAPH_MAX_NODES + 1];
    int    prev[GRAPH_MAX_NODES + 1];
    int    done[GRAPH_MAX_NODES + 1];

    if (!graph_has_node(g, start) || !graph_has_node(g, goal)) return 0;

    for (int i = 0; i <= GRAPH_MAX_NODES; ++i) {
        dist[i] = GRAPH_INF;
        prev[i] = -1;
        done[i] = 0;
    }
    dist[start] = 0;

    for (int iter = 0; iter < GRAPH_MAX_NODES; ++iter) {
        int u = -1;
        for (int i = 1; i <= GRAPH_MAX_NODES; ++i) {
            if (!done[i] && graph_has_node(g, i) && dist[i] < GRAPH_INF &&
                (u == -1 || dist[i] < dist[u])) u = i;
        }
        if (u == -1 || u == goal) break;
        done[u] = 1;

        for (int i = 0; i < g->edgeCount; ++i) {
            const GraphEdge* e = &g->edges[i];
            if (e->from != u || e->closed) continue;
            double nd = dist[u] + e->baseTime * e->congestion;
            if (nd < dist[e->to]) {
                dist[e->to] = nd;
                prev[e->to] = u;
            }
        }
    }

    if (dist[goal] >= GRAPH_INF) return 0;

    int tmp[GRAPH_MAX_NODES];
    int n = 0;
    for (int at = goal; at != -1 && n < GRAPH_MAX_NODES; at = prev[at]) {
        tmp[n++] = at;
        if (at == start) break;
    }
    if (n > maxPath) return 0;
    for (int i = 0; i < n; ++i) path[i] = tmp[n - 1 - i];

    if (seconds) *seconds = (int)dist[goal];
    return n;
}

int graph_reachable(const Graph* g, int start, int goal) {
    if (!graph_has_node(g, start) || !graph_has_node(g, goal)) return 0;
    if (start == goal) return 1;

    int seen[GRAPH_MAX_NODES + 1] = {0};
    int queue[GRAPH_MAX_NODES + 1];
    int head = 0, tail = 0;

    seen[start] = 1;
    queue[tail++] = start;

    while (head < tail) {
        int u = queue[head++];
        for (int i = 0; i < g->edgeCount; ++i) {
            const GraphEdge* e = &g->edges[i];
            if (e->from != u || e->closed || seen[e->to]) continue;
            if (e->to == goal) return 1;
            seen[e->to] = 1;
            queue[tail++] = e->to;
        }
    }
    return 0;
}