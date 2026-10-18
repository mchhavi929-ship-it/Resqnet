#ifndef USER_H
#define USER_H

#include "common.h"

typedef struct {
    char username[STR_LEN];
    char password[STR_LEN];
    char role[16];          /* "user" or "dispatcher" */
} User;

#endif