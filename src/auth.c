#include <stdio.h>
#include <string.h>
#include "auth.h"
#include "io.h"

#define USERS_FILE "data/users.txt"

static int find_user(const char* u, const char* p, char* role) {
    FILE* f = fopen(USERS_FILE, "r");
    if (!f) return 0;

    char line[256];
    while (fgets(line, sizeof line, f)) {
        if (line[0] == '#') continue;
        char fu[USER_LEN], fp[USER_LEN], fr[4];
        if (sscanf(line, "%31s %31s %3s", fu, fp, fr) != 3) continue;
        if (strcmp(fu, u) == 0 && strcmp(fp, p) == 0) {
            *role = fr[0];
            fclose(f);
            return 1;
        }
    }
    fclose(f);
    return 0;
}

static int user_exists(const char* u) {
    FILE* f = fopen(USERS_FILE, "r");
    if (!f) return 0;

    char line[256];
    while (fgets(line, sizeof line, f)) {
        if (line[0] == '#') continue;
        char fu[USER_LEN];
        if (sscanf(line, "%31s", fu) == 1 && strcmp(fu, u) == 0) {
            fclose(f);
            return 1;
        }
    }
    fclose(f);
    return 0;
}

int auth_run(char* userOut, int* isDispatcherOut) {
    while (1) {
        char choice[16], u[USER_LEN], p[USER_LEN];

        printf("\n=== RESQNET Login ===\n");
        printf("1. Login\n2. Register (user)\n0. Exit\nChoice: ");
        ask_line(choice, sizeof choice);
        if (choice[0] == '0' || choice[0] == '\0') return 0;

        printf("Username: ");
        ask_line(u, sizeof u);
        printf("Password: ");
        ask_line(p, sizeof p);

        if (choice[0] == '2') {
            if (u[0] == '\0' || p[0] == '\0' || strchr(u, ' ')) {
                printf("Username and password cannot be empty, and username cannot have spaces.\n");
                continue;
            }
            if (user_exists(u)) {
                printf("Username already taken.\n");
                continue;
            }
            FILE* f = fopen(USERS_FILE, "a");
            if (!f) {
                printf("Cannot write users file.\n");
                continue;
            }
            fprintf(f, "%s %s U\n", u, p);
            fclose(f);
            printf("Registered. Now choose Login.\n");
            continue;
        }

        char role = 0;
        if (find_user(u, p, &role)) {
            strncpy(userOut, u, USER_LEN - 1);
            userOut[USER_LEN - 1] = '\0';
            *isDispatcherOut = (role == 'D');
            printf("Welcome %s (%s)\n", u, *isDispatcherOut ? "Dispatcher" : "User");
            return 1;
        }
        printf("Wrong username or password.\n");
    }
}