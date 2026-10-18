#include <string.h>
#include "auth.h"
#include "store.h"

int auth_register(Store* s, const char* username, const char* password, const char* role) {
    if (s->userCount >= MAX_USERS) return 0;
    for (int k = 0; k < s->userCount; ++k) {
        if (strcmp(s->users[k].username, username) == 0) return 0;
    }
    User* u = &s->users[s->userCount++];
    copy_str(u->username, username, STR_LEN);
    copy_str(u->password, password, STR_LEN);
    copy_str(u->role, role, 16);
    return 1;
}

const User* auth_login(const Store* s, const char* username, const char* password) {
    for (int k = 0; k < s->userCount; ++k) {
        const User* u = &s->users[k];
        if (strcmp(u->username, username) == 0 && strcmp(u->password, password) == 0) {
            return u;
        }
    }
    return NULL;
}