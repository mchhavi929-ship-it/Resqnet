#ifndef AUTH_H
#define AUTH_H

#include "common.h"

int auth_login(const char* path, const char* user, const char* pass, char* role, int roleSize);

#endif