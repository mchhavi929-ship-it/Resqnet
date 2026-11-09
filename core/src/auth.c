#include <stdio.h>
#include <string.h>
#include "auth.h"

int auth_login(const char* path, const char* user, const char* pass, char* role) {
    FILE* f = fopen(path, "r");
    if (!f) return 0;

    char line[256], u[32], p[32], r[4];
    while (fgets(line, sizeof line, f)) {
        if (line[0] == '#') continue;
        if (sscanf(line, "%31s %31s %3s", u, p, r) != 3) continue;
        if (strcmp(u, user) == 0 && strcmp(p, pass) == 0) {
            *role = r[0];
            fclose(f);
            return 1;
        }
    }
    fclose(f);
    return 0;
}

int auth_register(const char* path, const char* user, const char* pass) {
    if (!*user || !*pass || strchr(user, ' ')) return 0;

    FILE* f = fopen(path, "r");
    if (f) {
        char line[256], u[32];
        while (fgets(line, sizeof line, f)) {
            if (line[0] == '#') continue;
            if (sscanf(line, "%31s", u) == 1 && strcmp(u, user) == 0) {
                fclose(f);
                return -1;
            }
        }
        fclose(f);
    }

    f = fopen(path, "a");
    if (!f) return 0;
    fprintf(f, "%s %s U\n", user, pass);
    fclose(f);
    return 1;
}