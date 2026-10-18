#include <stdio.h>
#include <string.h>
#include <ctype.h>
#include "city.h"

void city_init(City* c) {
    memset(c, 0, sizeof(City));
}

static int str_ieq(const char* a, const char* b) {
    while (*a && *b) {
        if (tolower((unsigned char)*a) != tolower((unsigned char)*b)) return 0;
        a++;
        b++;
    }
    return *a == '\0' && *b == '\0';
}

static void strip(char* s) {
    int n = (int)strlen(s);
    while (n > 0 && (s[n-1] == ' ' || s[n-1] == '\t' || s[n-1] == '\r' || s[n-1] == '\n')) {
        s[--n] = '\0';
    }
    char* p = s;
    while (*p == ' ' || *p == '\t') p++;
    if (p != s) memmove(s, p, strlen(p) + 1);
}

void city_add_road(City* c, int from, int to, int time) {
    if (c->roadCount + 2 > MAX_ROADS) return;

    Road* a = &c->roads[c->roadCount++];
    a->from = from; a->to = to;
    a->baseTime = time; a->congestion = 1.0; a->isClosed = 0;

    Road* b = &c->roads[c->roadCount++];
    b->from = to; b->to = from;
    b->baseTime = time; b->congestion = 1.0; b->isClosed = 0;
}

int city_load(const char* path, City* c) {
    FILE* f = fopen(path, "r");
    if (!f) return 0;

    char line[256];
    while (fgets(line, sizeof(line), f)) {
        if (line[0] == '#' || line[0] == '\n' || line[0] == '\r') continue;

        char tag;
        if (sscanf(line, " %c", &tag) != 1) continue;

        if (tag == 'J') {
            int id, x, y, off = 0;
            char type[16];
            int got = sscanf(line, " J %d %d %d %15s %n", &id, &x, &y, type, &off);
            if (got >= 4 && id >= 1 && id <= MAX_JUNCTIONS) {
                Junction* j = &c->junctions[id];
                j->id = id;
                j->x = x;
                j->y = y;
                j->isBlocked = 0;
                copy_str(j->type, type, sizeof(j->type));
                copy_str(j->name, line + off, STR_LEN);
                strip(j->name);
                c->hasJunction[id] = 1;
            }
        }
        else if (tag == 'R') {
            int from, to, dist, time;
            if (sscanf(line, " R %d %d %d %d", &from, &to, &dist, &time) == 4) {
                city_add_road(c, from, to, time);
            }
        }
    }
    fclose(f);
    return 1;
}

int city_find_by_name(const City* c, const char* name) {
    for (int id = 1; id <= MAX_JUNCTIONS; ++id) {
        if (!c->hasJunction[id]) continue;
        if (str_ieq(c->junctions[id].name, name)) return id;
    }
    return -1;
}

const char* city_name(const City* c, int id) {
    if (id < 1 || id > MAX_JUNCTIONS || !c->hasJunction[id]) return "unknown";
    return c->junctions[id].name;
}

void city_close_road(City* c, int a, int b) {
    for (int i = 0; i < c->roadCount; ++i) {
        Road* r = &c->roads[i];
        if ((r->from == a && r->to == b) || (r->from == b && r->to == a)) r->isClosed = 1;
    }
}

void city_set_congestion(City* c, int a, int b, double factor) {
    for (int i = 0; i < c->roadCount; ++i) {
        Road* r = &c->roads[i];
        if ((r->from == a && r->to == b) || (r->from == b && r->to == a)) r->congestion = factor;
    }
}

int city_shortest_path(const City* c, int start, int goal,
                       int path[], int maxPath, int* seconds) {
    double dist[MAX_JUNCTIONS + 1];
    int    prev[MAX_JUNCTIONS + 1];
    int    done[MAX_JUNCTIONS + 1];

    if (!c->hasJunction[start] || !c->hasJunction[goal]) return 0;

    for (int i = 0; i <= MAX_JUNCTIONS; ++i) {
        dist[i] = 1e18;
        prev[i] = -1;
        done[i] = 0;
    }
    dist[start] = 0;

    for (int iter = 0; iter < MAX_JUNCTIONS; ++iter) {
        int u = -1;
        for (int i = 1; i <= MAX_JUNCTIONS; ++i) {
            if (!done[i] && c->hasJunction[i] && dist[i] < 1e18 &&
                (u == -1 || dist[i] < dist[u])) u = i;
        }
        if (u == -1 || u == goal) break;
        done[u] = 1;

        for (int i = 0; i < c->roadCount; ++i) {
            const Road* r = &c->roads[i];
            if (r->from != u || r->isClosed) continue;
            if (c->junctions[r->to].isBlocked) continue;
            double nd = dist[u] + r->baseTime * r->congestion;
            if (nd < dist[r->to]) {
                dist[r->to] = nd;
                prev[r->to] = u;
            }
        }
    }

    if (dist[goal] >= 1e18) return 0;

    int tmp[MAX_JUNCTIONS];
    int n = 0;
    for (int at = goal; at != -1 && n < MAX_JUNCTIONS; at = prev[at]) {
        tmp[n++] = at;
        if (at == start) break;
    }
    if (n > maxPath) return 0;
    for (int i = 0; i < n; ++i) path[i] = tmp[n - 1 - i];

    if (seconds) *seconds = (int)dist[goal];
    return n;
}