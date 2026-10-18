#include <stdio.h>
#include <string.h>
#include "auth.h"

int auth_login(const char* path, const char* user, const char* pass, char* role, int roleSize) {
    FILE* f = fopen(path, "r");
    if (!f) return 0;

    char line[256];
    while (fgets(line, sizeof(line), f)) {
        if (line[0] == '#' || line[0] == '\n' || line[0] == '\r') continue;

        char u[USER_LEN], p[USER_LEN], r[16];
        if (sscanf(line, "%31s %31s %15s", u, p, r) != 3) continue;

        if (strcmp(u, user) == 0 && strcmp(p, pass) == 0) {
            strncpy(role, r, roleSize - 1);
            role[roleSize - 1] = '\0';
            fclose(f);
            return 1;
        }
    }
    fclose(f);
    return 0;
}