#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "store.h"

void store_init(Store* s) {
    memset(s, 0, sizeof(Store));
    s->nextIncidentId = 1;
}

static void chomp(char* s) {
    s[strcspn(s, "\r\n")] = '\0';
}

static int split(char* line, char* out[], int max) {
    int n = 0;
    char* p = line;
    out[n++] = p;
    while (n < max && (p = strchr(p, '|')) != NULL) {
        *p = '\0';
        p++;
        out[n++] = p;
    }
    return n;
}

int store_load(Store* s, const char* path) {
    FILE* f = fopen(path, "r");
    if (!f) return 0;

    char line[1024];
    while (fgets(line, sizeof(line), f)) {
        chomp(line);
        if (line[0] == '\0') continue;

        char* fld[10];
        int n = split(line, fld, 10);

        if (n >= 4 && strcmp(fld[0], "U") == 0 && s->userCount < MAX_USERS) {
            User* u = &s->users[s->userCount++];
            copy_str(u->username, fld[1], STR_LEN);
            copy_str(u->password, fld[2], STR_LEN);
            copy_str(u->role, fld[3], 16);
        }
        else if (n >= 10 && strcmp(fld[0], "I") == 0 && s->incidentCount < MAX_INCIDENTS) {
            Incident* i = &s->incidents[s->incidentCount++];
            i->id       = atoi(fld[1]);
            i->type     = atoi(fld[2]);
            i->severity = atoi(fld[3]);
            i->people   = atoi(fld[4]);
            copy_str(i->status,   fld[5], 16);
            copy_str(i->team,     fld[6], STR_LEN);
            copy_str(i->location, fld[7], STR_LEN);
            copy_str(i->reporter, fld[8], STR_LEN);
            copy_str(i->details,  fld[9], STR_LEN);
            if (i->id >= s->nextIncidentId) s->nextIncidentId = i->id + 1;
        }
    }
    fclose(f);
    return 1;
}

int store_save(const Store* s, const char* path) {
    FILE* f = fopen(path, "w");
    if (!f) return 0;

    for (int k = 0; k < s->userCount; ++k) {
        const User* u = &s->users[k];
        fprintf(f, "U|%s|%s|%s\n", u->username, u->password, u->role);
    }
    for (int k = 0; k < s->incidentCount; ++k) {
        const Incident* i = &s->incidents[k];
        fprintf(f, "I|%d|%d|%d|%d|%s|%s|%s|%s|%s\n",
                i->id, i->type, i->severity, i->people,
                i->status, i->team, i->location, i->reporter, i->details);
    }
    fclose(f);
    return 1;
}