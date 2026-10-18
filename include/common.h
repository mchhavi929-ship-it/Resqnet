#ifndef COMMON_H
#define COMMON_H

#include <string.h>
#include <stddef.h>

#define DATA_FILE        "data/resqnet.dat"
#define MAX_USERS        100
#define MAX_INCIDENTS    500
#define STR_LEN          128
#define INCIDENT_TYPES   24
#define DISPATCHER_CODE  "RESQ-DISPATCH-2026"

/* Safe string copy that always terminates */
static inline void copy_str(char* dst, const char* src, size_t n) {
    strncpy(dst, src, n - 1);
    dst[n - 1] = '\0';
}

#endif