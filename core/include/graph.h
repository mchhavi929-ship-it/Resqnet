#ifndef GRAPH_H
#define GRAPH_H

#ifdef __cplusplus
extern "C" {
#endif

#define GRAPH_MAX_NODES  50
#define GRAPH_MAX_EDGES  200
#define GRAPH_NAME_LEN   64
#define GRAPH_INF        1e18

typedef struct {
    int  id;
    int  x, y;
    int  present;
    char type[16];
    char name[GRAPH_NAME_LEN];
} GraphNode;

typedef struct {
    int    from, to;
    int    baseTime;
    double congestion;
    int    closed;
} GraphEdge;

typedef struct {
    GraphNode nodes[GRAPH_MAX_NODES + 1];
    GraphEdge edges[GRAPH_MAX_EDGES];
    int       edgeCount;
} Graph;

void graph_init(Graph* g);
int  graph_load(Graph* g, const char* path);
void graph_add_node(Graph* g, int id, int x, int y, const char* type, const char* name);
void graph_add_edge(Graph* g, int a, int b, int baseTime);
int  graph_find_by_name(const Graph* g, const char* name);
const char* graph_name(const Graph* g, int id);
int  graph_has_node(const Graph* g, int id);
int  graph_set_closed(Graph* g, int a, int b, int closed);
int  graph_shortest_path(const Graph* g, int start, int goal,
                         int path[], int maxPath, int* seconds);
int  graph_reachable(const Graph* g, int start, int goal);

#ifdef __cplusplus
}
#endif

#endif