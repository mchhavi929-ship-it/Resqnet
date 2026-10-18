#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "common.h"
#include "user.h"
#include "incident.h"
#include "store.h"
#include "auth.h"

/* ---------- input helpers ---------- */

static void ask_line(const char* prompt, char* buf, int size) {
    printf("%s", prompt);
    if (!fgets(buf, size, stdin)) { buf[0] = '\0'; return; }
    buf[strcspn(buf, "\r\n")] = '\0';
    for (char* p = buf; *p; ++p) if (*p == '|') *p = '/';
}

static int ask_int(const char* prompt, int lo, int hi) {
    char buf[64];
    while (1) {
        ask_line(prompt, buf, sizeof(buf));
        char* end;
        long v = strtol(buf, &end, 10);
        if (end != buf && *end == '\0' && v >= lo && v <= hi) return (int)v;
        printf("Please enter a number from %d to %d.\n", lo, hi);
    }
}

static void line(char ch) {
    for (int i = 0; i < 60; ++i) putchar(ch);
    putchar('\n');
}

/* ---------- display ---------- */

static void show_incident(const Incident* i) {
    printf("  ID: %d | %s | Severity %d/10 | People: %d\n",
           i->id, incident_type_name(i->type), i->severity, i->people);
    printf("  Location: %s\n", i->location);
    printf("  Status  : %s", i->status);
    if (i->team[0]) printf("  | Team: %s", i->team);
    printf("\n");
    if (i->details[0]) printf("  Details : %s\n", i->details);
}

static void show_precaution(int type) {
    printf("  PRECAUTION: %s\n", incident_precaution(type));
}

/* ---------- user side ---------- */

static void report_emergency(Store* s, const char* username) {
    line('-');
    printf("Select emergency type:\n");
    for (int t = 0; t < INCIDENT_TYPES; ++t) {
        printf("  %2d. %s\n", t + 1, incident_type_name(t));
    }
    int type = ask_int("Enter number (1-24): ", 1, INCIDENT_TYPES) - 1;

    char location[STR_LEN], details[STR_LEN];
    ask_line("Exact location (road, landmark): ", location, sizeof(location));
    int severity = ask_int("How serious? (1 = minor, 10 = critical): ", 1, 10);
    int people   = ask_int("How many people are affected? ", 0, 100000);
    ask_line("Describe what is happening: ", details, sizeof(details));

    int id = incident_add(s, type, severity, people, location, username, details);
    if (id < 0) {
        printf("Storage full, cannot save report.\n");
        return;
    }
    store_save(s, DATA_FILE);

    line('=');
    printf(" Report saved. Your incident ID is %d\n", id);
    printf(" Help is being sent. Team will be assigned shortly.\n");
    line('-');
    show_precaution(type);
    line('=');
}

static void my_reports(const Store* s, const char* username) {
    int found = 0;
    for (int k = 0; k < s->incidentCount; ++k) {
        const Incident* i = &s->incidents[k];
        if (strcmp(i->reporter, username) != 0) continue;
        found = 1;
        line('-');
        show_incident(i);
        show_precaution(i->type);
    }
    if (!found) printf("You have not reported any emergency yet.\n");
}

static void user_menu(Store* s, const char* username) {
    while (1) {
        line('=');
        printf(" USER MENU (%s)\n", username);
        line('=');
        printf("1. Report an emergency\n2. My reports and precautions\n3. Logout\n");
        int c = ask_int("Choose: ", 1, 3);
        if (c == 1) report_emergency(s, username);
        else if (c == 2) my_reports(s, username);
        else return;
    }
}

/* ---------- dispatcher side ---------- */

static void list_all(const Store* s) {
    if (s->incidentCount == 0) { printf("No incidents.\n"); return; }
    int order[MAX_INCIDENTS];
    int n = incident_sorted(s, order);
    for (int k = 0; k < n; ++k) {
        line('-');
        show_incident(&s->incidents[order[k]]);
    }
    line('-');
}

static void assign_team(Store* s) {
    int id = ask_int("Incident ID: ", 1, 100000);
    Incident* i = incident_find(s, id);
    if (!i) { printf("No incident with that ID.\n"); return; }

    char team[STR_LEN];
    ask_line("Team name (e.g. Ambulance-A1): ", team, sizeof(team));
    copy_str(i->team, team, STR_LEN);
    copy_str(i->status, "DISPATCHED", 16);
    store_save(s, DATA_FILE);
    printf("Team '%s' dispatched to incident %d.\n", i->team, id);
}

static void resolve(Store* s) {
    int id = ask_int("Incident ID: ", 1, 100000);
    Incident* i = incident_find(s, id);
    if (!i) { printf("No incident with that ID.\n"); return; }
    copy_str(i->status, "RESOLVED", 16);
    store_save(s, DATA_FILE);
    printf("Incident %d marked RESOLVED.\n", id);
}

static void relay_precaution(const Store* s) {
    int id = ask_int("Incident ID: ", 1, 100000);
    const Incident* i = NULL;
    for (int k = 0; k < s->incidentCount; ++k) {
        if (s->incidents[k].id == id) i = &s->incidents[k];
    }
    if (!i) { printf("No incident with that ID.\n"); return; }
    line('-');
    printf(" Tell the caller: %s\n", incident_type_name(i->type));
    show_precaution(i->type);
    line('-');
}

static void dispatcher_menu(Store* s, const char* username) {
    while (1) {
        line('=');
        printf(" DISPATCHER MENU (%s)\n", username);
        line('=');
        printf("1. View all incidents (most severe first)\n");
        printf("2. Assign team to an incident\n");
        printf("3. Mark incident resolved\n");
        printf("4. Show precaution for an incident\n");
        printf("5. Logout\n");
        int c = ask_int("Choose: ", 1, 5);
        if (c == 1) list_all(s);
        else if (c == 2) assign_team(s);
        else if (c == 3) resolve(s);
        else if (c == 4) relay_precaution(s);
        else return;
    }
}

/* ---------- login / register ---------- */

static void register_user(Store* s) {
    char u[STR_LEN], p[STR_LEN];
    ask_line("New username: ", u, sizeof(u));
    ask_line("New password: ", p, sizeof(p));
    int r = ask_int("Role (1 = user, 2 = dispatcher): ", 1, 2);

    const char* role = "user";
    if (r == 2) {
        char code[64];
        ask_line("Dispatcher access code: ", code, sizeof(code));
        if (strcmp(code, DISPATCHER_CODE) != 0) {
            printf("Wrong access code. Registration denied.\n");
            return;
        }
        role = "dispatcher";
    }

    if (auth_register(s, u, p, role)) {
        store_save(s, DATA_FILE);
        printf("Account created as %s. Please login.\n", role);
    } else {
        printf("Username already exists or storage full.\n");
    }
}

static void login(Store* s) {
    char u[STR_LEN], p[STR_LEN];
    ask_line("Username: ", u, sizeof(u));
    ask_line("Password: ", p, sizeof(p));

    const User* usr = auth_login(s, u, p);
    if (!usr) { printf("Wrong username or password.\n"); return; }

    if (strcmp(usr->role, "dispatcher") == 0) dispatcher_menu(s, usr->username);
    else                                      user_menu(s, usr->username);
}

/* ---------- main ---------- */

int main(void) {
    Store store;
    store_init(&store);
    store_load(&store, DATA_FILE);

    while (1) {
        line('=');
        printf(" RESQNET - Emergency Reporting System\n");
        line('=');
        printf("1. Login\n2. Register\n3. Exit\n");
        int c = ask_int("Choose: ", 1, 3);
        if (c == 1) login(&store);
        else if (c == 2) register_user(&store);
        else break;
    }
    printf("Goodbye.\n");
    return 0;
}