#include <assert.h>
#include <stdio.h>
#include "graph.h"

int main(void) {
    Graph g;
    graph_init(&g);
    graph_add_node(&g, 1, 0, 0, "base", "Base Station");
    graph_add_node(&g, 2, 100, 0, "normal", "Main Road");
    graph_add_node(&g, 3, 200, 0, "normal", "Station Chowk");
    graph_add_edge(&g, 1, 2, 60);
    graph_add_edge(&g, 2, 3, 50);
    graph_add_edge(&g, 1, 3, 120);

    int path[GRAPH_MAX_NODES], secs = 0;
    int n = graph_shortest_path(&g, 1, 3, path, GRAPH_MAX_NODES, &secs);
    assert(n == 3 && secs == 110);
    printf("PASS shortest route 1->3, %d s\n", secs);

    graph_set_closed(&g, 2, 3, 1);
    n = graph_shortest_path(&g, 1, 3, path, GRAPH_MAX_NODES, &secs);
    assert(n == 2 && secs == 120);
    printf("PASS reroute after closing 2-3\n");

    assert(graph_find_by_name(&g, "main road") == 2);
    printf("PASS case-insensitive name lookup\n");

    graph_set_closed(&g, 1, 3, 1);
    assert(graph_reachable(&g, 1, 3) == 0);
    printf("PASS unreachable when all roads blocked\n");

    Graph city;
    graph_init(&city);
    assert(graph_load(&city, "data/city.txt") == 1);
    assert(graph_find_by_name(&city, "City Hospital") == 4);
    printf("PASS loaded data/city.txt\n");

    printf("All graph tests passed.\n");
    return 0;
}