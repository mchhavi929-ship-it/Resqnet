#ifndef AUTH_H
#define AUTH_H

#ifdef __cplusplus
extern "C" {
#endif

int auth_login(const char* path, const char* user, const char* pass, char* role);
int auth_register(const char* path, const char* user, const char* pass);

#ifdef __cplusplus
}
#endif

#endif