#include <ctype.h>
#include <errno.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "config.h"

static int read_number(const char* path, const char* key, double* value) {
    FILE* file = fopen(path, "r");
    if (!file) return 0;

    char line[256];
    char keyPattern[96];
    snprintf(keyPattern, sizeof(keyPattern), "\"%s\"", key);
    int found = 0;
    while (fgets(line, sizeof(line), file)) {
        char* field = strstr(line, keyPattern);
        if (!field) continue;
        char* colon = strchr(field + strlen(keyPattern), ':');
        if (!colon) break;

        errno = 0;
        char* end = NULL;
        double parsed = strtod(colon + 1, &end);
        if (end == colon + 1 || errno == ERANGE || !isfinite(parsed)) break;
        while (isspace((unsigned char)*end)) end++;
        if (*end != ',' && *end != '}' && *end != '\0') break;

        *value = parsed;
        found = 1;
        break;
    }
    fclose(file);
    return found;
}

int resqnet_config_load(const char* path, ResqnetConfig* config) {
    if (!path || !config) return 0;

    double preparation = 0;
    if (!read_number(path, "responsePreparationSeconds", &preparation) ||
        preparation < 0 || preparation > 3600 || floor(preparation) != preparation) {
        return 0;
    }
    if (!read_number(path, "severityWeight", &config->severityWeight) ||
        config->severityWeight < 0) {
        return 0;
    }
    if (!read_number(path, "peopleAffectedWeight", &config->peopleAffectedWeight) ||
        config->peopleAffectedWeight < 0 ||
        (config->severityWeight == 0 && config->peopleAffectedWeight == 0)) {
        return 0;
    }
    if (!isfinite(10 * config->severityWeight +
                  100000 * config->peopleAffectedWeight)) {
        return 0;
    }

    config->responsePreparationSeconds = (int)preparation;
    return 1;
}
