#ifndef AUTH_H
#define AUTH_H

#include "common.h"
#include "user.h"

struct Store;

int         auth_register(struct Store* s, const char* username,
                          const char* password, const char* role);
const User* auth_login(const struct Store* s, const char* username, const char* password);

#endif